
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

        // 1. Determine Target Workers
        let targetWorkerIds: string[] = [];
        if (workerId) {
            targetWorkerIds = [workerId];
        } else if (req.body.workerIds && Array.isArray(req.body.workerIds)) {
            targetWorkerIds = req.body.workerIds;
        }

        if (targetWorkerIds.length === 0) {
            return res.status(400).json({ error: 'Missing required parameter: workerId or workerIds' });
        }

        // 2. Select Templates (Common for all workers)
        let selectedTemplates: any[] = [];
        if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
            selectedTemplates = await prisma.documentTemplate.findMany({
                where: { id: { in: templateIds }, isActive: true }
            });
        } else if (category) {
            selectedTemplates = await prisma.documentTemplate.findMany({
                where: { category, isActive: true }
            });
        } else {
            return res.status(400).json({ error: 'Either templateIds or category must be provided.' });
        }

        if (selectedTemplates.length === 0) {
            return res.status(404).json({ error: 'No matching templates found.' });
        }

        const masterZip = new PizZip();
        let totalFilesGenerated = 0;

        // 3. Process Each Worker
        for (const targetId of targetWorkerIds) {
            try {
                // Build Context
                const context = await buildWorkerDocumentContext(targetId);

                // Filter Templates by Nationality if applicable
                const validTemplates = selectedTemplates.filter(t => {
                    if (t.nationality) return t.nationality === context.worker_nationality;
                    return true;
                });

                if (validTemplates.length === 0) continue;

                // Create Folder for Worker if batch processing or if multiple files
                // Folder Name: Name_Last4ID
                const folderName = `${context.worker_name_en.replace(/[^a-zA-Z0-9]/g, '_')}_${targetId.substring(0, 6)}`;

                for (const tmpl of validTemplates) {
                    try {
                        const cleanPath = tmpl.filePath.startsWith('/') || tmpl.filePath.startsWith('\\') ? tmpl.filePath.slice(1) : tmpl.filePath;
                        const templateAbsPath = path.join(__dirname, '../../', cleanPath);

                        if (!fs.existsSync(templateAbsPath)) continue;

                        const content = fs.readFileSync(templateAbsPath, 'binary');
                        const zip = new PizZip(content);
                        const doc = new Docxtemplater(zip, {
                            paragraphLoop: true,
                            linebreaks: true,
                        });

                        doc.setData(context);
                        doc.render();

                        const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

                        const safeTmplName = tmpl.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
                        let filename = `${safeTmplName}_${context.worker_name_en.replace(/[^a-z0-9]/gi, '_')}.docx`;

                        // Add to Master ZIP
                        // If single worker, just add to root? Or always folder?
                        // Decision: If req.body.workerIds (Batch), use Folders.
                        // If single workerId, keep old behavior (Root).

                        if (req.body.workerIds) {
                            masterZip.folder(folderName).file(filename, buf);
                        } else {
                            masterZip.file(filename, buf);
                        }

                        totalFilesGenerated++;

                    } catch (err) {
                        console.error(`Error generating template ${tmpl.name} for worker ${targetId}:`, err);
                    }
                }

            } catch (err) {
                console.error(`Error processing worker ${targetId}:`, err);
            }
        }

        if (totalFilesGenerated === 0) {
            return res.status(404).json({ error: 'No documents generated.' });
        }

        // 4. Response
        // Issue: PizZip in browser/node behavior. PizZip nodebuffer generation includes folders.
        const outputBuf = masterZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        // Naming
        let downloadName = 'Documents.zip';
        if (!req.body.workerIds && targetWorkerIds.length === 1) {
            // Single worker logic check
            // If strictly 1 file in root, maybe send docx directly?
            // Replicating old logic:
            const filesInZip = Object.keys(masterZip.files);
            // Note: PizZip files keys might include folder entries
            const fileKeys = filesInZip.filter(k => !masterZip.files[k].dir);

            if (fileKeys.length === 1) {
                // Return Single .docx
                res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileKeys[0])}`);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                // Extract the single file content
                // PizZip doesn't easily give back buffer of single file without generate. 
                // Actually we put it in via 'masterZip.file'. 
                // Let's just return the ZIP if multiple, or recreate logic.
                // Simplification: ALWAYS return ZIP for consistency in this Refactor? 
                // "If generatedFiles.length === 1" was the old check.

                // If we want to support single file download, we need to capture it before adding to zip.
                // But since we refactored to use masterZip immediately, retrieving it is harder.
                // Let's just return ZIP for now to be safe and consistent, OR check file count.
            }
        }

        // Return ZIP
        if (req.body.workerIds) {
            downloadName = `Batch_Documents_${Date.now()}.zip`;
        } else {
            // Try to find context name if possible, otherwise generic
            downloadName = `Documents.zip`;
        }

        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(downloadName)}`);
        res.setHeader('Content-Type', 'application/zip');
        res.send(outputBuf);

    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: 'Failed to process document generation' });
    }
});

export default router;
