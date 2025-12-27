import { Router } from 'express';
import { templateService } from '../services/templateService';
import prisma from '../prisma';

const router = Router();

// GET /api/entry-documents/worker/:workerId/contracts - 取得移工的所有受聘合約
router.get('/worker/:workerId/contracts', async (req, res) => {
    try {
        const workerId = req.params.workerId;

        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: {
                deployments: {
                    orderBy: { startDate: 'desc' },
                    include: {
                        employer: true,
                        contractType: true
                    }
                }
            }
        });

        if (!worker) {
            return res.status(404).json({ error: '找不到移工資料' });
        }

        res.json({
            worker: {
                id: worker.id,
                englishName: worker.englishName,
                chineseName: worker.chineseName
            },
            deployments: worker.deployments
        });
    } catch (error: any) {
        console.error('Get Worker Contracts Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/entry-documents/generate - 批次產生入境文件
router.post('/generate', async (req, res) => {
    try {
        const { workerId, deploymentId } = req.body;

        if (!workerId) {
            return res.status(400).json({ error: '請提供移工ID (workerId)' });
        }

        const result = await templateService.generateWorkerEntryDocuments(workerId, deploymentId);

        res.json({
            success: true,
            worker: {
                id: result.worker.id,
                englishName: result.worker.englishName,
                chineseName: result.worker.chineseName
            },
            deployment: {
                id: result.deployment.id,
                startDate: result.deployment.startDate,
                employer: result.deployment.employer
            },
            documents: result.documents.map(doc => ({
                filename: doc.filename,
                size: doc.buffer.length
            }))
        });
    } catch (error: any) {
        console.error('Generate Entry Documents Error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
