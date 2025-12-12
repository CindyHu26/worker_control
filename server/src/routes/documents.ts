
import { Router } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const router = Router();

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

// POST /api/documents/generate
// Generate documents for a worker
router.post('/generate', async (req, res) => {
    try {
        const { workerId, templateIds } = req.body;

        if (!workerId || !templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
            return res.status(400).json({ error: 'Missing required parameters: workerId, templateIds (array)' });
        }

        // 1. Fetch Comprehensive Data
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: {
                // Deployment & Employer
                deployments: {
                    where: { status: { in: ['active', 'pending'] } },
                    orderBy: { startDate: 'desc' },
                    take: 1,
                    include: { employer: true }
                },
                // Dormitory
                dormitory: {
                    include: {
                        rooms: true // To find specific bed? Or just dorm level info
                    }
                },
                bed: {
                    include: {
                        room: {
                            include: { dormitory: true }
                        }
                    }
                },
                // Docs
                passports: { where: { isCurrent: true }, take: 1 },
                arcs: { where: { isCurrent: true }, take: 1 }
            }
        });

        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const deployment = worker.deployments[0];
        const employer = deployment?.employer;
        const passport = worker.passports[0];
        const arc = worker.arcs[0];

        // Determine Dorm Info (from explicit Bed relation first, then fallback to Dormitory relation)
        const dormBed = worker.bed;
        const dormRoom = dormBed?.room;
        const dormitory = dormRoom?.dormitory || worker.dormitory; // Fallback if assigned to dorm but not bed

        // 2. Map Data for Tags
        const tags = {
            // Worker
            worker_name_cn: worker.chineseName || '',
            worker_name_en: worker.englishName || '',
            worker_nationality: worker.nationality || '',
            worker_dob: worker.dob ? new Date(worker.dob).toLocaleDateString() : '',
            worker_mobile: worker.mobilePhone || '',
            worker_address_foreign: worker.foreignAddress || '',

            // ID Documents
            passport_no: passport?.passportNumber || '',
            passport_issue_date: passport?.issueDate ? new Date(passport.issueDate).toLocaleDateString() : '',
            passport_expiry_date: passport?.expiryDate ? new Date(passport.expiryDate).toLocaleDateString() : '',
            arc_no: arc?.arcNumber || '',
            arc_issue_date: arc?.issueDate ? new Date(arc.issueDate).toLocaleDateString() : '',
            arc_expiry_date: arc?.expiryDate ? new Date(arc.expiryDate).toLocaleDateString() : '',

            // Employer
            employer_name: employer?.companyName || '',
            employer_tax_id: employer?.taxId || '',
            employer_phone: employer?.phoneNumber || '',
            employer_address: employer?.address || '',
            employer_rep: employer?.responsiblePerson || '',

            // Job / Deployment
            job_description: deployment?.jobDescription || '',
            entry_date: deployment?.entryDate ? new Date(deployment.entryDate).toLocaleDateString() : '',
            contract_start: deployment?.startDate ? new Date(deployment.startDate).toLocaleDateString() : '',
            contract_end: deployment?.endDate ? new Date(deployment.endDate).toLocaleDateString() : '',

            // Dormitory
            dorm_name: dormitory?.name || '',
            dorm_address: dormitory?.address || '',
            dorm_landlord: dormitory?.landlordName || '',
            dorm_room: dormRoom?.roomNumber || '',
            dorm_bed: dormBed?.bedCode || '',

            // System
            today: new Date().toLocaleDateString(),
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate()
        };

        // 3. Generate Files
        const generatedFiles: { name: string, content: Buffer }[] = [];
        const templates = await prisma.documentTemplate.findMany({
            where: { id: { in: templateIds } } // If ID matches name in seed, this works. If UUID, user must send UUID.
            // Note: seed.ts creates UUIDs if we don't force 'name' as ID. 
            // In listed API, we returned {id...}. Front-end should send back those IDs.
        });

        for (const tmpl of templates) {
            try {
                // Resolve path relative to project root or absolute
                // Assuming filePath in DB starts with /templates/...
                // We need to map it to real path d:\worker_control\server\templates
                // OR checking where templates are stored.
                // Step 155 showed: path.join(__dirname, '../../templates/...')
                // So /templates in basic root.

                // Remove leading slash if present to avoid absolute path confusion on Windows
                const cleanPath = tmpl.filePath.startsWith('/') || tmpl.filePath.startsWith('\\') ? tmpl.filePath.slice(1) : tmpl.filePath;
                const templateAbsPath = path.join(__dirname, '../../', cleanPath);

                if (!fs.existsSync(templateAbsPath)) {
                    console.warn(`Template file missing: ${templateAbsPath}`);
                    continue; // Skip valid template record if file missing
                }

                const content = fs.readFileSync(templateAbsPath, 'binary');
                const zip = new PizZip(content);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                // Render Tag
                // Allow missing tags to be empty string instead of undefined
                doc.setData(tags);
                doc.render();

                const buf = doc.getZip().generate({
                    type: 'nodebuffer',
                    compression: 'DEFLATE',
                });

                // Filename
                // e.g. "LaborInsurance_JohnDoe.docx"
                // Clean name
                const safeTmplName = tmpl.name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
                const safeWorkerName = tags.worker_name_en.replace(/[^a-z0-9]/gi, '_');
                const filename = `${safeTmplName}_${safeWorkerName}.docx`;

                generatedFiles.push({ name: filename, content: buf });

            } catch (err) {
                console.error(`Error generating template ${tmpl.name}:`, err);
                // Continue with others
            }
        }

        if (generatedFiles.length === 0) {
            return res.status(404).json({ error: 'No documents could be generated (files missing or invalid IDs).' });
        }

        // 4. Response
        if (generatedFiles.length === 1) {
            // Single File
            const file = generatedFiles[0];
            res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(file.name)}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.send(file.content);
        } else {
            // Multi File ZIP
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
