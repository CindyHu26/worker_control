
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';

const router = Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use UTF-8 safe filename (timestamp + original name)
        // Ensure no weird characters break the filesystem
        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

const upload = multer({ storage });

// POST /api/attachments
router.post('/', upload.single('file'), async (req: any, res: any) => {
    try {
        const { refId, refTable } = req.body;
        const file = req.file;

        if (!file || !refId || !refTable) {
            return res.status(400).json({ error: 'Missing file or reference data' });
        }

        const newAttachment = await prisma.attachment.create({
            data: {
                refId,
                refTable,
                filePath: '/uploads/' + file.filename, // Relative path for serving
                fileName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // Original name
                fileType: file.mimetype,
            }
        });

        res.json(newAttachment);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// GET /api/attachments/:refTable/:refId
router.get('/:refTable/:refId', async (req, res) => {
    try {
        const { refTable, refId } = req.params;
        const attachments = await prisma.attachment.findMany({
            where: {
                refTable,
                refId
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });
        res.json(attachments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// DELETE /api/attachments/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get record to find file path
        const attachment = await prisma.attachment.findUnique({
            where: { id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // 2. Delete from DB
        await prisma.attachment.delete({
            where: { id }
        });

        // 3. Delete from File System
        // Construct absolute path. We stored relative path starting with /uploads/
        const absolutePath = path.join(__dirname, '../../', attachment.filePath);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

export default router;
