
import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const router = Router();

// Zod Schema (Creating)
const createRecruitmentSchema = z.object({
    employerId: z.string().uuid(),
    letterNumber: z.string().min(1, "發文號必填"),
    issueDate: z.coerce.date(),
    validUntil: z.coerce.date().optional(), // If not provided, backend should probably default or ensure it's handled. DB has default now.
    approvedQuota: z.coerce.number().min(0),

    // Taiwan Process Fields (Optional)
    industrialBureauRef: z.string().optional(),
    industrialBureauDate: z.coerce.date().optional(),
    industryTier: z.string().optional(),

    domesticRecruitmentRef: z.string().optional(), // 求才證明書序號
    domesticRecruitmentDate: z.coerce.date().optional(),

    reviewFeeReceiptNo: z.string().optional(), // 審查費收據
    reviewFeePayDate: z.coerce.date().optional(),
    reviewFeeAmount: z.coerce.number().default(200),

    workAddress: z.string().optional(),
    remarks: z.string().optional(),
});

// Zod Schema (Updating) - similar but strict on ID maybe? or reuse create schema
// For update, everything optional? or partial?
const updateRecruitmentSchema = createRecruitmentSchema.partial().omit({ employerId: true }); // EmployerId usually doesn't change

// POST /api/recruitment
router.post('/', async (req, res) => {
    try {
        const body = createRecruitmentSchema.parse(req.body);

        // Handle validUntil vs expiryDate logic
        // Schema has both. Frontend sends `validUntil`.
        // We should map `validUntil` to `validUntil` and also `expiryDate` if they are synonyms.
        // User prompt says: `expiryDate DateTime ... validUntil DateTime`.
        // Frontend sends: `validUntil`.
        // Let's ensure both are set.
        const expiry = body.validUntil || new Date(body.issueDate.getTime() + 365 * 24 * 60 * 60 * 1000); // Default +1 year?

        const newLetter = await prisma.employerRecruitmentLetter.create({
            data: {
                employerId: body.employerId,
                letterNumber: body.letterNumber,
                issueDate: body.issueDate,
                validUntil: expiry,
                expiryDate: expiry, // Sync them
                approvedQuota: body.approvedQuota,

                industrialBureauRef: body.industrialBureauRef,
                industrialBureauDate: body.industrialBureauDate,
                industryTier: body.industryTier,

                domesticRecruitmentRef: body.domesticRecruitmentRef,
                domesticRecruitmentDate: body.domesticRecruitmentDate,

                reviewFeeReceiptNo: body.reviewFeeReceiptNo,
                reviewFeePayDate: body.reviewFeePayDate,
                reviewFeeAmount: body.reviewFeeAmount,

                workAddress: body.workAddress,
                remarks: body.remarks,

                usedQuota: 0
            }
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

        const expiry = body.validUntil; // Might be undefined if not sending

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
            workAddress: body.workAddress,
            remarks: body.remarks,
        };

        if (expiry) {
            updateData.validUntil = expiry;
            updateData.expiryDate = expiry;
        }

        // Filter out undefined
        // Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        // Actually prisma ignores undefined if we don't pass them in `data`, but let's be safe.
        // Or with zod partial, they are present but undefined?
        // Zod partial returns optional fields.

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

export default router;
