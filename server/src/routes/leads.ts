import { Router } from 'express';
import prisma from '../prisma';
import { convertLeadToEmployer } from '../services/crmService';

const router = Router();

// GET /api/leads
router.get('/', async (req, res) => {
    try {
        const { status, assignedTo } = req.query;
        const where: any = {};
        if (status) where.status = String(status);
        if (assignedTo) where.assignedTo = String(assignedTo);

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedUser: { select: { username: true, email: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                interactions: { orderBy: { date: 'desc' } },
                assignedUser: { select: { username: true, email: true } }
            }
        });
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// POST /api/leads
// POST /api/leads
router.post('/', async (req, res) => {
    try {
        const {
            estimatedWorkerCount,
            companyName,
            industry,
            taxId,
            ...rest // 其他欄位
        } = req.body;

        // 1. 必填檢查 (防止空資料寫入)
        if (!companyName) {
            return res.status(400).json({ error: '公司名稱為必填欄位' });
        }

        // 2. 產業別驗證 (Industry Enum Validation)
        const VALID_INDUSTRIES = [
            'MANUFACTURING', 'CONSTRUCTION', 'FISHERY', 'HOME_CARE',
            'HOME_HELPER', 'INSTITUTION', 'AGRICULTURE', 'SLAUGHTER',
            'OUTREACH_AGRICULTURE', 'HOSPITALITY', 'OTHER'
        ];

        if (industry && !VALID_INDUSTRIES.includes(industry)) {
            return res.status(400).json({
                error: `無效的產業別: ${industry}. 請使用標準產業代碼。`
            });
        }

        // 3. 統編衝突檢查 (Conflict Check)
        if (taxId) {
            const existingLead = await prisma.lead.findFirst({
                where: {
                    // @ts-ignore: Stale Prisma Client types (requires server restart to regenerate)
                    taxId
                }
            });
            if (existingLead) {
                return res.status(409).json({
                    error: `統編 (${taxId}) 已存在於系統中，由業務 ${existingLead.contactPerson || 'Unknown'} 跟進中。`
                });
            }
        }

        // 3. 資料清洗與轉型 (Data Sanitization)
        const lead = await prisma.lead.create({
            data: {
                ...rest,
                companyName,
                industry,
                taxId,
                // 強制轉為整數，若無法轉換則存為 null 或 0
                estimatedWorkerCount: estimatedWorkerCount ? parseInt(String(estimatedWorkerCount), 10) : null,
                status: 'NEW'
            }
        });
        res.json(lead);
    } catch (error: any) {
        console.error('Lead Create Error:', error);
        res.status(500).json({ error: '建立潛在客戶失敗，請檢查輸入資料' });
    }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const lead = await prisma.lead.update({
            where: { id },
            data
        });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// POST /api/leads/:id/interactions
router.post('/:id/interactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, summary, detailedNotes, outcome, date, nextFollowUpDate } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Interaction
            const interaction = await tx.leadInteraction.create({
                data: {
                    leadId: id,
                    type,
                    summary,
                    detailedNotes,
                    outcome,
                    date: date ? new Date(date) : new Date()
                }
            });

            // 2. Update Lead (Status logic can be here, or just timestamp)
            const updateData: any = {
                lastContactDate: new Date(),
                // If interaction happened, status might implicitly move to CONTACTED if it was NEW?
                // "Auto update lastContactDate" requested.
            };

            if (nextFollowUpDate) {
                updateData.nextFollowUpDate = new Date(nextFollowUpDate);
            }

            // Optional: Auto-status
            const lead = await tx.lead.findUnique({ where: { id } });
            if (lead?.status === 'NEW') {
                updateData.status = 'CONTACTED';
            }

            await tx.lead.update({
                where: { id },
                data: updateData
            });

            return interaction;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
});

// POST /api/leads/:id/convert
router.post('/:id/convert', async (req, res) => {
    try {
        const { id } = req.params;
        // Assume user ID is available in req.user or similar middleware, otherwise pass in body or hardcode for now
        // For this prototype, we'll try to get it from a header or body, else fallback.
        // Assuming no auth middleware context in this snippet provided.
        const { operatorId, taxId, industryType, factoryAddress, avgDomesticWorkers, allocationRate, complianceStandard, zeroFeeEffectiveDate } = req.body;
        const opId = operatorId || 'system';

        const employer = await convertLeadToEmployer(id, opId, {
            taxId,
            industryType,
            factoryAddress,
            avgDomesticWorkers: avgDomesticWorkers ? Number(avgDomesticWorkers) : undefined,
            allocationRate: allocationRate ? Number(allocationRate) : undefined,
            complianceStandard,
            zeroFeeEffectiveDate: zeroFeeEffectiveDate ? new Date(zeroFeeEffectiveDate) : undefined
        });
        res.json({ success: true, employer });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
