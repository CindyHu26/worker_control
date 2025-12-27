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

        const { name, category, description, nationalityId, language, version } = req.body;
        const result = await templateService.uploadTemplate(req.file, {
            name,
            category,
            description,
            nationalityId,
            language,
            version
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Upload failed' });
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

// POST /api/templates/:id/test - 測試範本
router.post('/:id/test', async (req, res) => {
    try {
        const { testWorkerId } = req.body;
        if (!testWorkerId) {
            return res.status(400).json({ error: '請提供測試用移工ID (testWorkerId)' });
        }

        const result = await templateService.testTemplate(req.params.id, testWorkerId);

        if (result.success) {
            // 下載測試產生的文件
            const filename = result.filename || 'test_document.docx';
            res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(result.buffer);
        } else {
            res.status(400).json(result);
        }
    } catch (error: any) {
        console.error("Test Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/templates/:id/activate - 啟用範本
router.post('/:id/activate', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: '請提供使用者ID (userId)' });
        }

        const result = await templateService.activateTemplate(req.params.id, userId);
        res.json(result);
    } catch (error: any) {
        console.error("Activate Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/templates/:id/deactivate - 停用範本
router.post('/:id/deactivate', async (req, res) => {
    try {
        const result = await templateService.deactivateTemplate(req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error("Deactivate Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/templates/:id - 刪除範本
router.delete('/:id', async (req, res) => {
    try {
        const result = await templateService.deleteTemplate(req.params.id);
        res.json({ success: true, message: '範本已刪除' });
    } catch (error: any) {
        console.error("Delete Error:", error);
        res.status(400).json({ error: error.message });
    }
});

export default router;