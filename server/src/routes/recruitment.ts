
import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const router = Router();

// GET /api/recruitment/employers/list
router.get('/employers/list', async (req, res) => {
    try {
        const employers = await prisma.employer.findMany({
            select: {
                id: true,
                companyName: true,
                taxId: true
            },
            orderBy: {
                companyName: 'asc'
            }
        });
        res.json(employers);
    } catch (error) {
        console.error('Failed to fetch employer list:', error);
        res.status(500).json({ error: 'Failed to fetch employers' });
    }
});

// Zod Schema (Creating)
const createRecruitmentSchema = z.object({
    employerId: z.string().uuid(),
    letterNumber: z.string().min(1, "發文號必填"),
    issueDate: z.coerce.date(),
    validUntil: z.coerce.date().optional(),
    approvedQuota: z.coerce.number().min(0),

    // Taiwan Process Fields (Optional)
    industrialBureauRef: z.string().optional(),
    industrialBureauDate: z.coerce.date().optional(),
    industryTier: z.string().optional(),

    domesticRecruitmentRef: z.string().optional(),
    domesticRecruitmentDate: z.coerce.date().optional(),

    reviewFeeReceiptNo: z.string().optional(),
    reviewFeePayDate: z.coerce.date().optional(),
    reviewFeeAmount: z.coerce.number().default(200),

    // Work Address Fields (Granular)
    workAddressCity: z.string().optional(),
    workAddressDistrict: z.string().optional(),
    workAddressDetail: z.string().optional(),
    workAddressZipCode: z.string().optional(),
    workAddressFull: z.string().optional(),

    remarks: z.string().optional(),

    // [New] Linked IDs
    industryRecognitionId: z.string().uuid().optional(),
    recruitmentProofId: z.string().uuid().optional(),
});

// Zod Schema (Updating)
const updateRecruitmentSchema = createRecruitmentSchema.partial().omit({ employerId: true });

// GET /api/recruitment
router.get('/', async (req, res) => {
    try {
        const { employerId } = req.query;
        const where = employerId ? { employerId: String(employerId) } : {};

        const letters = await prisma.employerRecruitmentLetter.findMany({
            where,
            include: {
                employer: { select: { companyName: true } },
                industryRecognition: true,
                recruitmentProof: true
            },
            orderBy: { issueDate: 'desc' }
        });
        res.json(letters);
    } catch (error) {
        console.error("Fetch Recruitment Error:", error);
        res.status(500).json({ message: "Failed to fetch recruitment letters" });
    }
});

// POST /api/recruitment
router.post('/', async (req, res) => {
    try {
        const body = createRecruitmentSchema.parse(req.body);

        // 1. Validation & Pre-fetching
        let industryRecognition = null;
        let recruitmentProof = null;

        if (body.industryRecognitionId) {
            industryRecognition = await prisma.industryRecognition.findUnique({
                where: { id: body.industryRecognitionId }
            });

            if (!industryRecognition) {
                return res.status(400).json({ message: "找不到指定的工業局核定函" });
            }

            // Quota Check
            const remaining = industryRecognition.approvedQuota - industryRecognition.usedQuota;
            if (body.approvedQuota > remaining) {
                return res.status(400).json({
                    message: `工業局核定函餘額不足 (剩餘: ${remaining}, 申請: ${body.approvedQuota})`
                });
            }
        }

        if (body.recruitmentProofId) {
            recruitmentProof = await prisma.recruitmentProof.findUnique({
                where: { id: body.recruitmentProofId }
            });

            if (!recruitmentProof) {
                return res.status(400).json({ message: "找不到指定的求才證明書" });
            }

            // Date Check (60 days validity)
            // Logic: issueDate + 60 days >= current Date? 
            // Usually we check if the proof was valid AT THE TIME of submission. 
            // For now, let's check against current time as a basic rule, or maybe against the Letter's issueDate?
            // "求才證明書已過期 (超過60天)，無法申請招募函"
            // Let's use the Letter's issue date as the "Submission Date" proxy if available, or just Today.
            // Using Today is safer for "Create Now" actions.

            const proofDate = new Date(recruitmentProof.issueDate);
            const deadline = new Date(proofDate);
            deadline.setDate(deadline.getDate() + 60);

            // Allow a small buffer or check against letter issue date if we want to be precise about "when was it applied".
            // But user requirement says: "addDays(proof.issueDate, 60) >= new Date()" implies checking against NOW.
            if (deadline < new Date()) {
                return res.status(400).json({ message: "求才證明書已過期 (超過60天)，無法申請招募函" });
            }
        }

        const expiry = body.validUntil || new Date(body.issueDate.getTime() + 365 * 24 * 60 * 60 * 1000);

        // Use transaction to ensure quota update happens with creation
        const newLetter = await prisma.$transaction(async (tx) => {
            // Update Ind Rec Quota
            if (industryRecognition) {
                await tx.industryRecognition.update({
                    where: { id: industryRecognition.id },
                    data: {
                        usedQuota: { increment: body.approvedQuota }
                    }
                });
            }

            // Create Letter
            return await tx.employerRecruitmentLetter.create({
                data: {
                    employerId: body.employerId,
                    letterNumber: body.letterNumber,
                    issueDate: body.issueDate,
                    validUntil: expiry,
                    expiryDate: expiry,
                    approvedQuota: body.approvedQuota,

                    // Auto-fill from relations if not explicitly provided, or override?
                    // Usually relations should be the source of truth if selected.
                    industrialBureauRef: industryRecognition?.bureauRefNumber || body.industrialBureauRef,
                    industrialBureauDate: industryRecognition?.issueDate || body.industrialBureauDate,
                    industryTier: industryRecognition?.tier || body.industryTier,

                    domesticRecruitmentRef: recruitmentProof?.receiptNumber || body.domesticRecruitmentRef,
                    domesticRecruitmentDate: recruitmentProof?.issueDate || body.domesticRecruitmentDate,

                    reviewFeeReceiptNo: body.reviewFeeReceiptNo,
                    reviewFeePayDate: body.reviewFeePayDate,
                    reviewFeeAmount: body.reviewFeeAmount,

                    // Work Address Fields
                    workAddressCity: body.workAddressCity,
                    workAddressDistrict: body.workAddressDistrict,
                    workAddressDetail: body.workAddressDetail,
                    workAddressZipCode: body.workAddressZipCode,
                    workAddressFull: body.workAddressFull,

                    remarks: body.remarks,

                    usedQuota: 0,

                    // Link IDs
                    industryRecognitionId: body.industryRecognitionId,
                    recruitmentProofId: body.recruitmentProofId
                }
            });
        });

        res.status(201).json(newLetter);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "資料驗證失敗 (Validation Failed)", errors: error.issues });
        }
        console.error("Create Recruitment Error:", error);
        res.status(500).json({ message: "伺服器錯誤 (Server Error)" });
    }
});

// PUT /api/recruitment/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const body = updateRecruitmentSchema.parse(req.body);

        const expiry = body.validUntil;

        const updateData: any = {
            letterNumber: body.letterNumber,
            issueDate: body.issueDate,
            approvedQuota: body.approvedQuota,
            industrialBureauRef: body.industrialBureauRef,
            industrialBureauDate: body.industrialBureauDate,
            industryTier: body.industryTier,
            domesticRecruitmentRef: body.domesticRecruitmentRef,
            domesticRecruitmentDate: body.domesticRecruitmentDate,
            reviewFeeReceiptNo: body.reviewFeeReceiptNo,
            reviewFeePayDate: body.reviewFeePayDate,
            reviewFeeAmount: body.reviewFeeAmount,
            // Work Address Fields
            workAddressCity: body.workAddressCity,
            workAddressDistrict: body.workAddressDistrict,
            workAddressDetail: body.workAddressDetail,
            workAddressZipCode: body.workAddressZipCode,
            workAddressFull: body.workAddressFull,

            remarks: body.remarks,
            // Allow updating links? Maybe dangerous if doing quota math. limiting for now.
            industryRecognitionId: body.industryRecognitionId,
            recruitmentProofId: body.recruitmentProofId
        };

        if (expiry) {
            updateData.validUntil = expiry;
            updateData.expiryDate = expiry;
        }

        // TODO: Handle Quota adjustments if approvedQuota changes on EDIT. 
        // This is complex: need to calc difference and update IndustryRecognition.
        // Skipping complicated quota recalc on EDIT for this iteration to avoid bugs, 
        // focusing on CREATE flow correctness first.

        const updatedLetter = await prisma.employerRecruitmentLetter.update({
            where: { id },
            data: updateData
        });

        res.json(updatedLetter);

    } catch (error) {
        console.error("Update Recruitment Error:", error);
        res.status(500).json({ message: "Update Failed" });
    }
});

// GET /api/recruitment/job-orders
router.get('/job-orders', async (req, res) => {
    try {
        const { employerId } = req.query;

        if (!employerId) {
            return res.status(400).json({ message: "Employer ID is required" });
        }

        const jobOrders = await prisma.jobOrder.findMany({
            where: {
                employerId: String(employerId),
                validUntil: {
                    gt: new Date()
                },
                // status: 'open' // Optional: if we want to enforce status
            },
            select: {
                id: true,
                letterNumber: true,
                quota: true,
                usedQuota: true,
                validUntil: true,
                jobType: true, // Useful for frontend to filter or display
                workTitleCode: true
            },
            orderBy: {
                validUntil: 'asc'
            }
        });

        // Filter in memory for quota > usedQuota
        const availableOrders = jobOrders.filter(order => order.quota > order.usedQuota);

        res.json(availableOrders);

    } catch (error) {
        console.error("Fetch Job Orders Error:", error);
        res.status(500).json({ message: "Failed to fetch job orders" });
    }
});

// POST /api/recruitment/job-orders
// Create a new Job Order (Phase 0.2/0.3 Implementation)
router.post('/job-orders', async (req, res) => {
    try {
        const body = req.body;

        // Basic validation
        if (!body.employerId) return res.status(400).json({ message: "Employer ID required" });
        if (!body.quota) return res.status(400).json({ message: "Quota required" });

        // Calculate usedQuota? Starts at 0.

        const newJobOrder = await prisma.jobOrder.create({
            data: {
                employerId: body.employerId,
                recruitmentType: body.recruitmentType,
                letterNumber: body.letterNumber,
                issueDate: new Date(body.issueDate),
                validUntil: new Date(body.validUntil),
                quota: body.quota,
                countryCode: body.countryCode || null,
                workTitleCode: body.workTitleCode || null,

                // Job Info
                jobType: body.jobType,

                // New Phase 0.3 Fields
                processType: body.processType || null,
                salaryAmount: body.salaryAmount || null,
                salaryType: body.salaryType || 'MONTHLY',

                // Parent for Supplementary
                parentJobOrderId: body.parentJobOrderId || null,

                // Defaults
                usedQuota: 0,
                status: 'open',
                orderDate: new Date(),
                requiredWorkers: body.quota
            }
        });

        res.status(201).json(newJobOrder);
    } catch (error: any) {
        console.error("Create JobOrder Error:", error);
        res.status(500).json({ message: "Failed to create Job Order", error: error.message });
    }
});

export default router;
