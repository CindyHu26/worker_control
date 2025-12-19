
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Helper to get a system user for auditing
async function getSystemUser() {
    const user = await prisma.internalUser.findFirst({
        orderBy: { createdAt: 'asc' } // Assume first user is Admin/System
    });
    return user?.id || '';
}

// POST /api/batch/transfer-agency
router.post('/transfer-agency', async (req, res) => {
    try {
        const { employerIds, newAgencyCompanyId } = req.body; // employerIds is Array

        if (!employerIds || !Array.isArray(employerIds) || !newAgencyCompanyId) {
            return res.status(400).json({ error: 'Invalid parameters: employerIds (Array) and newAgencyCompanyId required' });
        }

        const systemUserId = await getSystemUser();
        if (!systemUserId) return res.status(500).json({ error: 'System user not found for audit log' });

        // 1. Verify New Agency
        const newAgency = await prisma.agencyCompany.findUnique({
            where: { id: newAgencyCompanyId }
        });
        if (!newAgency) return res.status(404).json({ error: 'Target Agency not found' });

        // 2. Transaction
        const operations = [];

        for (const empId of employerIds) {
            // Update Employer
            const updateOp = prisma.employer.update({
                where: { id: empId },
                data: { agencyCompanyId: newAgencyCompanyId }
            });
            operations.push(updateOp);

            // Log System Comment
            const logOp = prisma.systemComment.create({
                data: {
                    recordId: empId,
                    recordTableName: 'employers',
                    content: `Batch Operation: Transferred to Agency '${newAgency.name}'`,
                    createdBy: systemUserId
                }
            });
            operations.push(logOp);
        }

        await prisma.$transaction(operations);

        res.json({
            message: `Successfully transferred ${employerIds.length} employers to ${newAgency.name}`
        });

    } catch (error) {
        console.error('Batch Transfer Agency Error:', error);
        res.status(500).json({ error: 'Failed to transfer agency' });
    }
});

// POST /api/batch/update-fees
router.post('/update-fees', async (req, res) => {
    try {
        const { employerId, dormitoryId, feeType, newAmount, effectiveDate } = req.body;
        // feeType: 'service' | 'accommodation'

        if ((!employerId && !dormitoryId) || !feeType || newAmount === undefined) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const systemUserId = await getSystemUser();

        // 1. Find Target Deployments
        let whereClause: any = { status: 'active' };
        let recordIdForLog = '';
        let tableNameForLog = '';

        if (employerId) {
            whereClause.employerId = employerId;
            recordIdForLog = employerId;
            tableNameForLog = 'employers';
        } else if (dormitoryId) {
            whereClause.worker = {
                OR: [
                    { dormitoryId: dormitoryId },
                    { bed: { room: { dormitoryId: dormitoryId } } }
                ]
            };
            recordIdForLog = dormitoryId;
            tableNameForLog = 'dormitories';
        }

        const deployments = await prisma.deployment.findMany({
            where: whereClause,
            select: { id: true }
        });
        const deploymentIds = deployments.map(d => d.id);

        if (deploymentIds.length === 0) {
            return res.json({ message: 'No active deployments found', count: 0, matchedDeployments: 0 });
        }

        if (req.body.dryRun) {
            return res.json({
                message: 'Dry run successful',
                matchedDeployments: deploymentIds.length,
                updatedRecords: 0,
                dryRun: true
            });
        }

        // 2. Prepare Data
        const updateData: any = {};
        if (feeType === 'service') {
            updateData.amountYear1 = newAmount;
            updateData.amountYear2 = newAmount;
            updateData.amountYear3 = newAmount;
        } else if (feeType === 'accommodation') {
            updateData.accommodationFee = newAmount;
        } else {
            return res.status(400).json({ error: 'Invalid feeType' });
        }

        const dateStr = effectiveDate ? new Date(effectiveDate).toLocaleDateString() : new Date().toLocaleDateString();

        // 3. Transaction
        const operations = [];

        // Batch Update MonthlyServiceFee
        const updateOp = prisma.monthlyServiceFee.updateMany({
            where: { deploymentId: { in: deploymentIds } },
            data: updateData
        });
        operations.push(updateOp);

        // Log System Comment (Single log on the Filter Object - Employer or Dorm)
        if (systemUserId) {
            const logOp = prisma.systemComment.create({
                data: {
                    recordId: recordIdForLog,
                    recordTableName: tableNameForLog,
                    content: `Batch Operation: Updated ${feeType} fee to ${newAmount}. Effective: ${dateStr}. Affected ${deploymentIds.length} deployments.`,
                    createdBy: systemUserId
                }
            });
            operations.push(logOp);
        }

        await prisma.$transaction(operations);

        res.json({
            message: 'Fees updated successfully',
            updatedRecords: deploymentIds.length
        });

    } catch (error) {
        console.error('Batch Update Fees Error:', error);
        res.status(500).json({ error: 'Failed to update fees' });
    }
});

// POST /api/batch/transfer-dorm
router.post('/transfer-dorm', async (req, res) => {
    try {
        const { workerIds, newDormitoryId, moveDate } = req.body;
        // workerIds is Array

        if (!workerIds || !Array.isArray(workerIds) || !newDormitoryId || !moveDate) {
            return res.status(400).json({ error: 'Missing parameters: workerIds[], newDormitoryId, moveDate' });
        }

        const systemUserId = await getSystemUser();
        if (!systemUserId) return res.status(500).json({ error: 'System user not found for audit log' });

        // 1. Get New Dorm Details
        const newDorm = await prisma.dormitory.findUnique({
            where: { id: newDormitoryId }
        });
        if (!newDorm) return res.status(404).json({ error: 'Target Dormitory not found' });

        const actualMoveDate = new Date(moveDate);
        const closeDate = new Date(actualMoveDate);
        closeDate.setDate(closeDate.getDate() - 1); // Close old history previous day

        // 2. Transaction
        const operations = [];

        for (const workerId of workerIds) {
            // A. Close Old History
            // Find active history
            const closeHistoryOp = prisma.workerAddressHistory.updateMany({
                where: {
                    workerId: workerId,
                    endDate: null
                },
                data: {
                    endDate: closeDate
                }
            });
            operations.push(closeHistoryOp);

            // B. Create New History
            const createHistoryOp = prisma.workerAddressHistory.create({
                data: {
                    workerId: workerId,
                    addressType: 'dormitory',
                    addressDetail: newDorm.address,
                    startDate: actualMoveDate,
                    // endDate is null (Active)
                }
            });
            operations.push(createHistoryOp);

            // C. Update Worker Relation (and clear bed assignment if any, to be safe. Actually prompt said "Update Worker... dormitoryId = newDormitoryId")
            // Note: Moving to a dorm doesn't automatically assign a BED. 
            // We should clear `dormitoryBedId` to avoid inconsistency (Worker in Dorm A but Bed in Dorm B).
            const updateWorkerOp = prisma.worker.update({
                where: { id: workerId },
                data: {
                    dormitoryId: newDormitoryId,
                    dormitoryBedId: null // Clear bed assignment as they are moving
                }
            });
            operations.push(updateWorkerOp);

            // D. Log
            const logOp = prisma.systemComment.create({
                data: {
                    recordId: workerId,
                    recordTableName: 'workers',
                    content: `Batch Operation: Moved to dormitory '${newDorm.name}' on ${actualMoveDate.toLocaleDateString()}`,
                    createdBy: systemUserId
                }
            });
            operations.push(logOp);
        }

        await prisma.$transaction(operations);

        res.json({
            message: `Successfully transferred ${workerIds.length} workers to ${newDorm.name}`
        });

    } catch (error) {
        console.error('Batch Transfer Dorm Error:', error);
        res.status(500).json({ error: 'Failed to transfer dormitory' });
    }
});

export default router;
