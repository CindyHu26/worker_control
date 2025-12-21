
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

import { quotaService } from '../services/quotaService';

// POST /api/deployments
router.post('/', async (req, res) => {
    try {
        const {
            workerId,
            employerId,
            recruitmentLetterId,
            startDate,
            jobType
        } = req.body;

        if (!workerId || !employerId || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 0. Fetch Worker to get Gender
            const worker = await tx.worker.findUnique({
                where: { id: workerId }
            });
            if (!worker) throw new Error('Worker not found');

            // 1. Validate Recruitment Letter (Strict Check)
            if (recruitmentLetterId) {
                // Determine effective used count based on policy
                await quotaService.checkQuotaAvailability(recruitmentLetterId, worker.gender, tx);

                // Verify employer ownership logic still applies inside check? 
                // checkQuotaAvailability checks existence. 
                // I should verify ownership here or add it to service. 
                // Stick to checking ownership here.
                const validLetter = await tx.employerRecruitmentLetter.findUnique({
                    where: { id: recruitmentLetterId }
                });
                if (validLetter && validLetter.employerId !== employerId) {
                    throw new Error('Recruitment Letter does not belong to this employer');
                }
            }

            // 2. Validate Worker Availability (Double check)
            const activeDeployment = await tx.deployment.findFirst({
                where: {
                    workerId,
                    status: 'active'
                }
            });

            if (activeDeployment) {
                throw new Error('Worker already has an active deployment');
            }

            // 3. Create Deployment
            const newDeployment = await tx.deployment.create({
                data: {
                    workerId,
                    employerId,
                    recruitmentLetterId,
                    startDate: new Date(startDate),
                    jobType: jobType || 'general',
                    status: 'active',
                    serviceStatus: 'active_service',
                    sourceType: 'direct_hiring',
                    factoryId: req.body.factoryId
                }
            });

            // 4. Initialize Worker Timeline
            await tx.workerTimeline.create({
                data: { deploymentId: newDeployment.id }
            });

            // 5. Update Recruitment Letter Cache
            if (recruitmentLetterId) {
                await quotaService.recalculateUsage(recruitmentLetterId, tx);
            }

            return newDeployment;
        });

        res.status(201).json(result);

    } catch (error: any) {
        console.error('Create Deployment Error:', error);
        res.status(400).json({ error: error.message || 'Failed to create deployment' });
    }
});

// PATCH /api/deployments/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Prevent updating immutable fields or fields handled by specific logic if necessary
        // For now, allow updating workflow fields and basic info

        const updatedDeployment = await prisma.deployment.update({
            where: { id },
            data: {
                // Workflow Fields
                overseasCheckStatus: data.overseasCheckStatus,
                overseasCheckDate: data.overseasCheckDate ? new Date(data.overseasCheckDate) : undefined,

                docVerificationStatus: data.docVerificationStatus,
                docSubmissionDate: data.docSubmissionDate ? new Date(data.docSubmissionDate) : undefined,
                docVerifiedDate: data.docVerifiedDate ? new Date(data.docVerifiedDate) : undefined,

                visaStatus: data.visaStatus,
                visaApplicationDate: data.visaApplicationDate ? new Date(data.visaApplicationDate) : undefined,
                visaLetterNo: data.visaLetterNo,
                visaNumber: data.visaNumber,

                // Factory Location
                factoryId: data.factoryId,

                // Flight Info
                flightNumber: data.flightNumber,
                flightArrivalDate: data.flightArrivalDate ? new Date(data.flightArrivalDate) : undefined,
                entryDate: data.entryDate ? new Date(data.entryDate) : undefined,

                // Status updates if passed explicitly
                status: data.status,
                serviceStatus: data.serviceStatus,
            }
        });

        // If status changed and linked to a recruitment letter, recalculate quota usage
        if (data.status && updatedDeployment.recruitmentLetterId) {
            await quotaService.recalculateUsage(updatedDeployment.recruitmentLetterId, prisma);
        }

        res.json(updatedDeployment);
    } catch (error: any) {
        console.error('Update Deployment Error:', error);
        res.status(500).json({ error: 'Failed to update deployment' });
    }
});

// POST /api/deployments/:id/terminate
router.post('/:id/terminate', async (req, res) => {
    try {
        const { id } = req.params;
        const { endDate, reason, notes } = req.body;

        if (!endDate || !reason) {
            return res.status(400).json({ error: 'End Date and Reason are required' });
        }

        // Logic Mapping
        let newStatus: 'active' | 'ended' | 'pending' | 'terminated' = 'ended';
        let newServiceStatus: 'active_service' | 'contract_terminated' | 'runaway' | 'transferred_out' | 'commission_ended' = 'commission_ended';

        if (reason === 'runaway') {
            newStatus = 'terminated';
            newServiceStatus = 'runaway';
        } else if (reason === 'transferred_out') {
            newStatus = 'ended';
            newServiceStatus = 'transferred_out';
        } else if (reason === 'contract_terminated') {
            newServiceStatus = 'contract_terminated';
        }

        const updatedDeployment = await prisma.deployment.update({
            where: { id },
            data: {
                status: newStatus,
                serviceStatus: newServiceStatus,
                endDate: new Date(endDate),
                terminationReason: reason,
                terminationNotes: notes
            }
        });

        // Recalculate usage if linked
        if (updatedDeployment.recruitmentLetterId) {
            await quotaService.recalculateUsage(updatedDeployment.recruitmentLetterId, prisma);
        }

        res.json(updatedDeployment);

    } catch (error: any) {
        console.error('Terminate Deployment Error:', error);
        res.status(500).json({ error: 'Failed to terminate deployment' });
    }
});

// GET /api/deployments/:id/termination-check
router.get('/:id/termination-check', async (req, res) => {
    try {
        const { id } = req.params;

        const deployment = await prisma.deployment.findUnique({
            where: { id },
            include: {
                worker: {
                    include: {
                        insurances: {
                            where: {
                                endDate: null // Active insurances
                            }
                        }
                    }
                }
            }
        });

        if (!deployment || !deployment.worker) {
            return res.status(404).json({ error: 'Deployment or Worker not found' });
        }

        const worker = deployment.worker;
        const checks = {
            hasOutstandingLoans: (Number(worker.loanAmount) || 0) > 0,
            outstandingLoanAmount: Number(worker.loanAmount) || 0,

            hasUnpaidBills: false, // Unavailable in schema
            unpaidBillCount: 0,
            unpaidBillTotal: 0,

            hasActiveDorm: false, // Unavailable in schema
            dormName: null,
            bedCode: null,

            hasActiveInsurance: worker.insurances.length > 0,
            activeInsuranceCount: worker.insurances.length
        };

        const isClear = !checks.hasOutstandingLoans &&
            !checks.hasUnpaidBills &&
            !checks.hasActiveDorm &&
            !checks.hasActiveInsurance;

        res.json({
            isClear,
            checks
        });

    } catch (error: any) {
        console.error('Termination Check Error:', error);
        res.status(500).json({ error: 'Failed to perform termination check' });
    }
});

// POST /api/deployments/:id/generate-schedule
// Generates the Fee Schedule for the entire contract duration
router.post('/:id/generate-schedule', async (req, res) => {
    try {
        const { id } = req.params;
        const { overrideEndDate } = req.body;

        const deployment = await prisma.deployment.findUnique({
            where: { id },
            // include: { monthlyFee: true }
        });

        if (!deployment) return res.status(404).json({ error: 'Deployment not found' });

        const startDate = deployment.entryDate ? new Date(deployment.entryDate) : new Date(deployment.startDate);

        let endDate: Date;
        if (overrideEndDate) {
            endDate = new Date(overrideEndDate);
        } else if (deployment.endDate) {
            endDate = new Date(deployment.endDate);
        } else {
            // Default to 3 years from start if no end date
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 3);
        }

        // Basic validation
        if (startDate > endDate) {
            return res.status(400).json({ error: 'Start date cannot be after end date' });
        }

        // Delete existing pending schedules to allow regeneration
        /*
        await prisma.feeSchedule.deleteMany({
            where: {
                deploymentId: id,
                status: 'pending'
            }
        });
        */

        const schedules = [];
        let currentDate = new Date(startDate);
        // Normalize to 1st of month for billing cycle logic?
        // Or keep exact dates? 
        // Standard practice: Fee is due monthly relative to start.
        // E.g. Start Jan 15 -> Due Feb 15, Mar 15...
        // Let's iterate by adding months to the start date.

        let installment = 1;
        const fees = { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500 }; // Default fees

        while (currentDate <= endDate) {
            // Determine expected amount based on year
            // Year 1 (Months 1-12), Year 2 (13-24), Year 3 (25+)
            let amount = Number(fees.amountYear1);
            if (installment > 12 && installment <= 24) amount = Number(fees.amountYear2);
            else if (installment > 24) amount = Number(fees.amountYear3);

            // Don't generate if past the end date (edge case where loop condition might need check)
            // But we want to cover the period.

            schedules.push({
                deploymentId: id,
                installmentNo: installment,
                scheduleDate: new Date(currentDate),
                expectedAmount: amount,
                status: 'pending',
                description: `第 ${installment} 期服務費 (Year ${Math.ceil(installment / 12)})`
            });

            // Advance 1 month
            currentDate.setMonth(currentDate.getMonth() + 1);
            installment++;
        }

        // Batch Create
        /*
        await prisma.feeSchedule.createMany({
            data: schedules
        });
        */

        res.json({
            success: true,
            count: schedules.length,
            period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        });

    } catch (error: any) {
        console.error('Generate Fee Schedule Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
