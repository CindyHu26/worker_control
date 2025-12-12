
import { Router } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const router = Router();

// POST /api/documents/generate
router.post('/generate', async (req, res) => {
    const { templateType, resourceId } = req.body;

    try {
        if (templateType === 'transfer_application') {
            // 1. Fetch Data
            const worker = await prisma.worker.findUnique({
                where: { id: resourceId },
                include: {
                    deployments: {
                        where: { status: 'active' },
                        include: { employer: true }
                    },
                    passports: {
                        where: { isCurrent: true }
                    },
                    arcs: {
                        where: { isCurrent: true }
                    }
                }
            });

            if (!worker) {
                return res.status(404).json({ error: 'Worker not found' });
            }

            const activeDeployment = worker.deployments[0];
            const currentEmployer = activeDeployment?.employer;
            const passport = worker.passports[0];
            const arc = worker.arcs[0];

            // 2. Map Data
            const data = {
                worker_name: worker.chineseName || worker.englishName,
                worker_english_name: worker.englishName,
                nationality: worker.nationality,
                passport_no: passport?.passportNumber || '',
                arc_no: arc?.arcNumber || '',
                employer_name: currentEmployer?.companyName || '',
                employer_tax_id: currentEmployer?.taxId || '',
                employer_rep: currentEmployer?.responsiblePerson || '',
                today_date: new Date().toLocaleDateString()
            };

            // 3. Load Template
            const templatePath = path.join(__dirname, '../../templates/transfer_application.docx');

            if (!fs.existsSync(templatePath)) {
                // FALLBACK for demonstration if template is missing
                return res.status(400).json({
                    error: `Template file not found at ${templatePath}. Please upload a .docx template.`
                });
            }

            const content = fs.readFileSync(templatePath, 'binary');

            // 4. Fill Template
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(data);

            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            // 5. Send Response
            res.setHeader('Content-Disposition', `attachment; filename=Transfer_App_${worker.englishName}.docx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.send(buf);

        } else {
            res.status(400).json({ error: 'Unknown template type' });
        }
    } catch (error) {
        console.error('Document Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate document' });
    }
});

export default router;
