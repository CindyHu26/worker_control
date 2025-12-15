
import prisma from '../prisma';

export const checkRecruitmentReadiness = async (employerId: string) => {
    const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        include: {
            factoryInfo: true,
            laborCounts: { orderBy: { year: 'desc', month: 'desc' }, take: 1 }
        }
    });

    if (!employer) throw new Error('Employer not found');

    const missingFields: string[] = [];

    // 1. Basic Info
    if (!employer.taxId || employer.taxId.length !== 8) missingFields.push('Invalid or Missing Tax ID');
    if (!employer.responsiblePerson) missingFields.push('Missing Responsible Person Name');

    // Responsible Person ID Check (Basic Taiwan ID format: Need 1 letter + 9 digits)
    const idRegex = /^[A-Z][0-9]{9}$/;
    if (!employer.responsiblePersonIdNo || !idRegex.test(employer.responsiblePersonIdNo)) {
        missingFields.push('Missing or Invalid Responsible Person ID');
    }

    // 2. Insurance Info
    if (!employer.laborInsuranceNo) missingFields.push('Missing Labor Insurance No');
    if (!employer.industryCode) missingFields.push('Missing Industry Code');

    // 3. Factory Specific
    const isManufacturing = employer.category === 'MANUFACTURING' || employer.industryType?.includes('製造');
    if (isManufacturing) {
        if (!employer.factoryInfo?.factoryRegistrationNo && !employer.factoryRegistrationNo) {
            missingFields.push('Missing Factory Registration No');
        }
        // Check address (Factory Address or Company Address)
        const hasAddress = employer.address || employer.factoryInfo?.factoryAddress;
        if (!hasAddress) missingFields.push('Missing Factory Address');
    }

    // 4. Quota / Labor Count
    // Check if any labor count record exists
    const hasLaborCount = await prisma.employerLaborCount.findFirst({
        where: { employerId }
    });

    if (!hasLaborCount) {
        missingFields.push('Missing 3K5 Labor Count History');
    }

    const isReady = missingFields.length === 0;

    return {
        isReady,
        status: isReady ? 'READY_TO_RECRUIT' : 'MISSING_INFO',
        missingFields,
        employerName: employer.companyName
    };
};
