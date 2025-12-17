import { Router } from 'express';
import { permitService, PermitType } from '../services/permitService';

const router = Router();

// GET /api/deployments/:id/permits - 取得許可歷史
router.get('/deployments/:id/permits', async (req, res) => {
    try {
        const history = await permitService.getPermitHistory(req.params.id);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch permit history' });
    }
});

// POST /api/deployments/:id/permits - 新增/展延許可
router.post('/deployments/:id/permits', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            permitNumber,
            issueDate,
            expiryDate,
            type,
            receiptNumber,
            applicationDate,
            feeAmount
        } = req.body;

        // 簡單驗證
        if (!permitNumber || !issueDate || !expiryDate || !type) {
            return res.status(400).json({ error: 'Missing required fields (permitNumber, dates, type)' });
        }

        const result = await permitService.createPermit({
            deploymentId: id,
            permitNumber,
            issueDate,
            expiryDate,
            type: type as PermitType,
            receiptNumber,
            applicationDate,
            feeAmount
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create Permit Error:', error);
        // 回傳具體的錯誤訊息給前端 (例如：違反法規流程)
        res.status(400).json({ error: error.message || 'Failed to create permit' });
    }
});

// GET /api/deployments/:id/permits/check - 檢查是否需要展延
router.get('/deployments/:id/permits/check', async (req, res) => {
    try {
        const status = await permitService.checkPermitExpiry(req.params.id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to check permit status' });
    }
});

export default router;