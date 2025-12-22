
import { Router } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import multer from 'multer';
import { buildWorkerDocumentContext, getTemplateKeys } from '../utils/documentContext';
import { storageService } from '../services/storageService';

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

// POST /api/documents/batch-generate
// Advanced generation with Context Overrides (Dates, Address, Hospital)
// Returns: ZIP file URL (or triggers download in current arch) and File List
router.post('/batch-generate', async (req, res) => {
    try {
        const { workerId, templateIds, globalParams } = req.body;

        if (!workerId || !templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
            return res.status(400).json({ error: 'WorkerId and TemplateIds are required.' });
        }

        // 1. Fetch Templates
        const templates = await prisma.documentTemplate.findMany({
            where: { id: { in: templateIds }, isActive: true }
        });

        if (templates.length === 0) {
            return res.status(404).json({ error: 'No valid templates found.' });
        }

        // 2. Resolve Address Logic
        // globalParams: { addressOption, entryDate, medCheckDate, dispatchDate, hospitalName, agentName }
        let resolvedAddress = '';
        if (globalParams?.addressOption) {
            // Fetch necessary employer info to resolve address
            // We need to fetch the worker's employer relation properly
            // Ideally we do this via Prisma here or let ContextBuilder handle if we passed the option?
            // Since we promised the API handles resolution, let's fetch the info.

            const worker = await prisma.worker.findUnique({
                where: { id: workerId },
                include: {
                    deployments: {
                        where: { status: 'active' },
                        include: {
                            employer: {
                                include: {
                                    agency: true
                                }
                            }
                        }
                    }
                }
            });

            const emp = worker?.deployments[0]?.employer;
            if (emp) {
                switch (globalParams.addressOption) {
                    case 'FACTORY': {
                        let fAddr = '';
                        if (emp.industryAttributes) {
                            try {
                                const attrs = emp.industryAttributes as any;
                                fAddr = attrs.factoryAddress;
                            } catch (e) { }
                        }
                        resolvedAddress = fAddr || emp.address || '';
                        break;
                    }
                    case 'EMPLOYER_HOME':
                        resolvedAddress = emp.address || '';
                        break;
                    case 'COMPANY':
                        resolvedAddress = emp.address || '';
                        break;
                    case 'AGENCY':
                        resolvedAddress = emp.agency?.address || '';
                        break;
                    default:
                        resolvedAddress = '';
                }
            }
        }

        // 3. Prepare Overrides
        const overrides: any = {};
        if (globalParams) {
            if (globalParams.entryDate) overrides['custom_entry_date'] = globalParams.entryDate; // YYYY/MM/DD expected from frontend? OR Date obj? context usually expects formatted strings or handles formatting.
            if (globalParams.medCheckDate) overrides['custom_med_date'] = globalParams.medCheckDate;
            if (globalParams.dispatchDate) overrides['custom_dispatch_date'] = globalParams.dispatchDate;
            if (globalParams.hospitalName) overrides['check_hospital_name'] = globalParams.hospitalName;
            if (globalParams.agentName) overrides['agent_contact_name'] = globalParams.agentName;

            if (resolvedAddress) overrides['residence_addr'] = resolvedAddress;
            if (resolvedAddress) overrides['custom_residence_addr'] = resolvedAddress; // Alias
        }

        // 4. Generate Context
        const context = await buildWorkerDocumentContext(workerId, overrides);

        // 5. Generate Files
        const masterZip = new PizZip();
        const fileList: { name: string, url: string }[] = [];

        // Define temp dir for individual accessibility (optional, if we want to return links)
        // For now, simpler to just return ZIP blob like the other endpoint?
        // Requirement says: "Simultaneously provide Single File Links and ZIP"
        // This implies we DO need to save them to disk.

        const outputDir = path.join(__dirname, '../../public/downloads/temp'); // Assuming public folder or similar
        // Let's use a safe temp dir.
        // If we want the user to download via "Link", we need a static file server route.
        // Assuming /api/downloads/temp is static or we create a route for it.
        // Let's stick to generating the ZIP Buffer for this response, 
        // AND providing a "virtual" file list or creating a wrapper endpoint for individual download?
        // Current constraint: I cannot easily set up a static file server without modifying index.ts
        // Compromise: This API will return the ZIP. The "Single File Download" buttons on Frontend will 
        // call a DIFFERENT endpoint `GET /api/documents/generate-single?workerId=..&templateId=...`
        // OR: We persist the files in a temp folder and return their paths.

        // Let's try persisting to `d:\worker_control\server\temp` and standardizing a route to serve them.
        const tempDir = path.join(__dirname, '../../temp_docs');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Clean up old files? (Skip for prototype)

        for (const tmpl of templates) {
            try {
                const cleanPath = tmpl.filePath.startsWith('/') || tmpl.filePath.startsWith('\\') ? tmpl.filePath.slice(1) : tmpl.filePath;
                const templateAbsPath = path.join(__dirname, '../../', cleanPath);

                if (!fs.existsSync(templateAbsPath)) continue;

                const content = fs.readFileSync(templateAbsPath, 'binary');
                const zip = new PizZip(content);
                const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

                doc.setData(context);
                doc.render();

                const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
                const safeTmplName = tmpl.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
                const filename = `${safeTmplName}_${context.worker_name_en.replace(/[^a-z0-9]/gi, '_')}.docx`;

                // Save to Temp
                const fileGuid = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const tempFilePath = path.join(tempDir, `${fileGuid}.docx`);
                fs.writeFileSync(tempFilePath, buf);

                // Add to ZIP
                masterZip.file(filename, buf);

                fileList.push({
                    name: filename,
                    url: `/api/documents/download-temp/${fileGuid}/${encodeURIComponent(filename)}` // We need this route
                });

            } catch (err) {
                console.error(`Error generating ${tmpl.name}:`, err);
            }
        }

        const zipBuf = masterZip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        const zipGuid = `${Date.now()}_packet.zip`;
        fs.writeFileSync(path.join(tempDir, zipGuid), zipBuf);

        res.json({
            success: true,
            zipUrl: `/api/documents/download-temp/${zipGuid}/Batch_Docs.zip`,
            files: fileList
        });

    } catch (error) {
        console.error('Batch Gen Error:', error);
        res.status(500).json({ error: 'Batch generation failed.' });
    }
});

// GET /api/documents/download-temp/:guid/:filename
// Serve temp files
router.get('/download-temp/:guid/:filename', (req, res) => {
    const { guid, filename } = req.params;
    // Validate guid format to prevent path traversal
    if (!/^[a-zA-Z0-9_.]+$/.test(guid)) {
        return res.status(400).send('Invalid file ID');
    }

    const tempDir = path.join(__dirname, '../../temp_docs');
    const filePath = path.join(tempDir, guid);

    if (fs.existsSync(filePath)) {
        res.download(filePath, filename); // Set Content-Disposition automatically
    } else {
        res.status(404).send('File not found or expired');
    }
});


/**
 * POST /api/documents/batch-download
 * Body: { attachmentIds: string[] }
 * Returns: Streamed Zip File
 */
router.post('/batch-download', async (req, res) => {
    try {
        const { attachmentIds } = req.body;

        if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
            return res.status(400).json({ error: 'attachmentIds array is required and must not be empty' });
        }

        await storageService.streamBatchAsZip(attachmentIds, res);

        // Note: Response is handled by the stream pipe, so we don't send json here
    } catch (error) {
        console.error('Batch Download Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error during batch download' });
        }
    }
});

export default router;
