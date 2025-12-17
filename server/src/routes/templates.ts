import { Router } from 'express';
import multer from 'multer';
import { templateService } from '../services/templateService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // 暫存記憶體，由 Service 寫入磁碟

// GET /api/templates - 列出所有模板
router.get('/', async (req, res) => {
    try {
        const category = req.query.category as string;
        const list = await templateService.listTemplates(category);
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list templates' });
    }
});

// POST /api/templates - 上傳新模板
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { name, category, code } = req.body;
        const result = await templateService.uploadTemplate(req.file, { name, category, code });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// POST /api/templates/:id/generate - 產生文件並下載
router.post('/:id/generate', async (req, res) => {
    try {
        const { contextType, contextId } = req.body;
        // e.g. { contextType: 'recruitment', contextId: 'job_order_uuid' }

        const { filename, buffer } = await templateService.generateDocument(req.params.id, contextType, contextId);

        // 設定下載標頭
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        res.send(buffer);
    } catch (error: any) {
        console.error("Generate Error:", error);
        res.status(400).json({ error: error.message });
    }
});

export default router;