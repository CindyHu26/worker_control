
import prisma from '../prisma';

export const renewPassport = async (workerId: string, newPassportData: {
    passportNumber: string,
    issueDate: Date | string,
    expiryDate: Date | string,
    issuePlace?: string
}) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Archive current passport
        await tx.workerPassport.updateMany({
            where: { workerId, isCurrent: true },
            data: { isCurrent: false }
        });

        // 2. Create new passport
        const newPassport = await tx.workerPassport.create({
            data: {
                workerId,
                passportNumber: newPassportData.passportNumber,
                issueDate: new Date(newPassportData.issueDate),
                expiryDate: new Date(newPassportData.expiryDate),
                issuePlace: newPassportData.issuePlace,
                isCurrent: true,
                isVerified: false // Default to false until verified
            }
        });

        return newPassport;
    });
};

export const updatePassport = async (passportId: string, data: {
    passportNumber?: string,
    issueDate?: Date | string,
    expiryDate?: Date | string,
    issuePlace?: string,
    isVerified?: boolean
}) => {
    // Only for data correction
    return await prisma.workerPassport.update({
        where: { id: passportId },
        data: {
            ...data,
            issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
        }
    });
};

export const renewArc = async (workerId: string, newArcData: {
    arcNumber: string,
    issueDate: Date | string,
    expiryDate: Date | string
}) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Archive current ARC
        await tx.workerArc.updateMany({
            where: { workerId, isCurrent: true },
            data: { isCurrent: false }
        });

        // 2. Create new ARC
        const newArc = await tx.workerArc.create({
            data: {
                workerId,
                arcNumber: newArcData.arcNumber,
                issueDate: new Date(newArcData.issueDate),
                expiryDate: new Date(newArcData.expiryDate),
                isCurrent: true,
                isVerified: false
            }
        });

        return newArc;
    });
};

export const analyzeWorkerHealth = async (workerId: string) => {
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            passports: { where: { isCurrent: true } },
            arcs: { where: { isCurrent: true } }
        }
    });

    if (!worker) throw new Error('Worker not found');

    const issues: string[] = [];
    const criticalMissing: string[] = [];

    // 1. Check Personal Info
    if (!worker.englishName) criticalMissing.push('Missing English Name');
    if (!worker.dob) criticalMissing.push('Missing DOB');
    if (!worker.nationality) criticalMissing.push('Missing Nationality');

    // 2. Check Passport
    const currentPassport = worker.passports[0];
    if (!currentPassport) {
        criticalMissing.push('No Active Passport');
    } else {
        if (new Date(currentPassport.expiryDate) < new Date()) {
            criticalMissing.push('Passport Expired');
        } else {
            const monthsLeft = (new Date(currentPassport.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
            if (monthsLeft < 6) issues.push(`Passport expiring soon (${Math.floor(monthsLeft)} months)`);
        }

        // Data Integrity Check (Simple Name check if implicit rule exists, but mostly manual verification)
    }

    // 3. Check ARC
    const currentArc = worker.arcs[0];
    // ARC is only critical if they are already in country or "active" deployment? 
    // Assuming strictly required for "Ready" status if they are deployed. 
    // We'll just check existence.
    if (!currentArc) {
        issues.push('No Active ARC (Required for residency)');
    } else {
        if (new Date(currentArc.expiryDate) < new Date()) {
            issues.push('ARC Expired');
        }
    }

    let status = 'GREEN';
    if (criticalMissing.length > 0) status = 'RED';
    else if (issues.length > 0) status = 'YELLOW';

    return {
        status,
        healthScore: status === 'GREEN' ? 100 : (status === 'YELLOW' ? 80 : 50),
        issues,
        criticalMissing,
        data: {
            passport: currentPassport,
            arc: currentArc
        }
    };
};

export const getWorkerDashboardData = async (workerId: string) => {
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            // 1. Core Relations
            passports: { where: { isCurrent: true } },
            arcs: { where: { isCurrent: true } },
            
            // 2. Fetch Active Deployment
            deployments: {
                where: { status: 'active' },
                take: 1,
                include: {
                    employer: true,
                    recruitmentLetter: true,
                    entryPermit: true,
                    employmentPermit: {
                        orderBy: { issueDate: 'desc' },
                        take: 1
                    },
                    timelines: true
                }
            }
        }
    });

    if (!worker) return null;

    const currentDeployment = worker.deployments[0] || null;
    const currentPassport = worker.passports[0] || null;
    const currentArc = worker.arcs[0] || null;

    // 3. Flatten for Frontend "Old System" view
    return {
        basic: {
            id: worker.id,
            nameEn: worker.englishName,
            nameCh: worker.chineseName,
            nationality: worker.nationality,
            mobile: worker.mobilePhone,
            passportNo: currentPassport?.passportNumber,
            passportExpiry: currentPassport?.expiryDate,
            arcNo: currentArc?.arcNumber,
            arcExpiry: currentArc?.expiryDate,
        },
        job: {
            employerName: currentDeployment?.employer?.companyName,
            workAddress: currentDeployment?.employer?.address || currentDeployment?.jobDescription,
            salary: (currentDeployment as any)?.basicSalary, // Casting due to potential schema mismatch found in research
            jobType: currentDeployment?.jobType,
        },
        permits: {
            recruitmentNo: currentDeployment?.recruitmentLetter?.letterNumber,
            entryPermitNo: (currentDeployment as any)?.entryPermit?.permitNo,
            employmentPermitNo: (currentDeployment as any)?.employmentPermit?.permitNumber,
            employmentPermitDate: (currentDeployment as any)?.employmentPermit?.issueDate,
        },
        dates: {
            entryDate: currentDeployment?.entryDate,
            startDate: currentDeployment?.startDate,
            endDate: currentDeployment?.endDate,
        }
    };
};
