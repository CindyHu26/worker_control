import { Router } from 'express';
import prisma from '../prisma';
import { convertLeadToEmployer } from '../services/crmService';

const router = Router();

// Helper to avoid implicit any in template literals or calculations if needed
const getRate = (leads: any[], totalLeads: number) => {
    return totalLeads > 0
        ? (leads.filter((l: any) => l.status === 'WON').length / totalLeads) * 100
        : 0;
};

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
                // assignedUser: { select: { name: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Filter helper
        const recentLeads = leads.filter((l: any) => {
            // Logic if needed, or just standard filter
            return true;
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
                // assignedUser: { select: { name: true } }
            } as any
        });
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// POST /api/leads
router.post('/', async (req, res) => {
    try {
        const {
            estimatedWorkerCount,
            companyName,
            industry,
            taxId,
            ...rest
        } = req.body;

        // 1. 必填檢查
        if (!companyName) {
            return res.status(400).json({ error: '公司名稱為必填欄位' });
        }

        // 2. 產業別驗證
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

        // 3. 衝突檢查
        if (taxId) {
            const existingLead = await prisma.lead.findFirst({ where: { taxId } });
            if (existingLead) {
                return res.status(409).json({
                    error: `統編 (${taxId}) 已存在於系統中，由業務 ${existingLead.contactPerson || 'Unknown'} 跟進中。`
                });
            }

            const existingEmployer = await prisma.employer.findUnique({ where: { taxId } });
            if (existingEmployer) {
                return res.status(409).json({
                    error: `此統編 (${taxId}) 已是正式客戶 (${existingEmployer.companyName})，請直接至客戶管理新增需求。`,
                });
            }
        }

        // 4. 建立
        const lead = await prisma.lead.create({
            data: {
                ...rest,
                companyName,
                industry,
                taxId,
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

        const result = await prisma.$transaction(async (tx: any) => {
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
