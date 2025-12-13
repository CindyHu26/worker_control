
import { Router } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import multer from 'multer';
import { buildWorkerDocumentContext, getTemplateKeys } from '../utils/documentContext';

const router = Router();

// Configure Multer for Template Uploads
const templatesDir = path.join(__dirname, '../../templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Organize by category if provided
        const category = req.body.category || 'general';
        const categoryDir = path.join(templatesDir, category);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        cb(null, categoryDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp_originalname
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Only accept .docx files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.originalname.endsWith('.docx')) {
            cb(null, true);
        } else {
            cb(new Error('Only .docx files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// GET /api/documents/templates
// List active templates
router.get('/templates', async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause: any = { isActive: true };

        if (category) {
            whereClause.category = String(category);
        }

        const templates = await prisma.documentTemplate.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                category: true,
                description: true
            }
        });

        res.json(templates);
    } catch (error) {
        console.error('Fetch Templates Error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// POST /api/documents/templates
// Upload a new template
router.post('/templates', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { name, category, description } = req.body;

        if (!name || !category) {
            // Clean up uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Missing required fields: name, category' });
        }

        // Validate Template Tags
        let validationWarning: string | null = null;
        try {
            const content = fs.readFileSync(req.file.path, 'binary');
            const zip = new PizZip(content);
            const docXml = zip.file('word/document.xml')?.asText() || '';

            // Simple regex to find {tag_name}
            // Note: This matches raw XML text, which might be fragmented.
            // But it works for simple cases and advises the user.
            const tagRegex = /\{([a-zA-Z0-9_]+)\}/g;
            const matches = [...docXml.matchAll(tagRegex)].map(m => m[1]);
            const uniqueTags = [...new Set(matches)];

            const allowedKeys = getTemplateKeys();
            const unknownTags = uniqueTags.filter(tag => !allowedKeys.includes(tag));

            if (unknownTags.length > 0) {
                validationWarning = `Detected unknown tags: {${unknownTags.join('}, {')}}. Please check for typos.`;
            }
        } catch (err) {
            console.warn('Template Validation Warning: Failed to parse docx', err);
        }

        // Store relative path from templates directory
        const relativePath = path.relative(templatesDir, req.file.path).replace(/\\/g, '/');
        const filePath = `/templates/${relativePath}`;

        // Create database record
        const template = await prisma.documentTemplate.create({
            data: {
                name,
                category,
                description: description || null,
                filePath,
                isActive: true
            }
        });

        res.status(201).json({
            message: 'Template uploaded successfully',
            warning: validationWarning,
            template: {
                id: template.id,
                name: template.name,
                category: template.category,
                description: template.description
            }
        });

    } catch (error) {
        console.error('Template Upload Error:', error);
        // Clean up file if database operation fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload template' });
    }
});

// POST /api/documents/generate
router.post('/generate', async (req, res) => {
    try {
        const { workerId, templateIds, category } = req.body;

        if (!workerId) {
            return res.status(400).json({ error: 'Missing required parameter: workerId' });
        }

        // 1. Build Global Context
        const context = await buildWorkerDocumentContext(workerId);

        // 2. Select Templates
        let selectedTemplates: any[] = [];

        if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
            // Manual Selection
            selectedTemplates = await prisma.documentTemplate.findMany({
                where: { id: { in: templateIds }, isActive: true }
            });
        } else if (category) {
            // Auto Select by Category + Nationality
            const allCatTemplates = await prisma.documentTemplate.findMany({
                where: { category, isActive: true }
            });

            // Filter logic: Prefer specific nationality, allow general
            selectedTemplates = allCatTemplates.filter(t => {
                // If template has specific nationality, it MUST match
                if (t.nationality) {
                    return t.nationality === context.worker_nationality;
                }
                // If template implies general (null nationality), it's valid for everyone
                return true;
            });

            // Refinement: If specific exists, maybe exclude general?
            // Current simple logic: Include all valid candidates.
            // But usually we just want ONE contract.
            // Let's stick to: "If match nationality OR null"
        } else {
            return res.status(400).json({ error: 'Either templateIds or category must be provided.' });
        }

        if (selectedTemplates.length === 0) {
            return res.status(404).json({ error: 'No matching templates found.' });
        }

        const tags = context; // Direct mapping using the global context builder

        // 3. Generate Files
        const generatedFiles: { name: string, content: Buffer }[] = [];

        for (const tmpl of selectedTemplates) {
            try {
                const cleanPath = tmpl.filePath.startsWith('/') || tmpl.filePath.startsWith('\\') ? tmpl.filePath.slice(1) : tmpl.filePath;
                const templateAbsPath = path.join(__dirname, '../../', cleanPath);

                if (!fs.existsSync(templateAbsPath)) {
                    console.warn(`Template file missing: ${templateAbsPath}`);
                    continue;
                }

                const content = fs.readFileSync(templateAbsPath, 'binary');
                const zip = new PizZip(content);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                doc.setData(tags);
                doc.render();

                const buf = doc.getZip().generate({
                    type: 'nodebuffer',
                    compression: 'DEFLATE',
                });

                const safeTmplName = tmpl.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
                const safeWorkerName = tags.worker_name_en.replace(/[^a-z0-9]/gi, '_');
                const filename = `${safeTmplName}_${safeWorkerName}.docx`;

                generatedFiles.push({ name: filename, content: buf });

            } catch (err) {
                console.error(`Error generating template ${tmpl.name}:`, err);
            }
        }

        if (generatedFiles.length === 0) {
            return res.status(404).json({ error: 'No documents could be generated (files missing or invalid criteria).' });
        }

        // 4. Response
        if (generatedFiles.length === 1) {
            const file = generatedFiles[0];
            res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(file.name)}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.send(file.content);
        } else {
            const zip = new PizZip();
            for (const f of generatedFiles) {
                zip.file(f.name, f.content);
            }
            const zipBuffer = zip.generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
            const zipName = `${tags.worker_name_en}_Documents.zip`;
            res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(zipName)}`);
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
        }

    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: 'Failed to process document generation' });
    }
});

export default router;
