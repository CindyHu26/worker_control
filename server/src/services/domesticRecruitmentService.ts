import { differenceInDays, startOfDay } from 'date-fns';
import prisma from '../prisma';

export const domesticRecruitmentService = {
    /**
     * Validate the wait period between Domestic Recruitment Registration and Certificate Application.
     * MFG/Construction (Corporate) -> 21 days
     * Caretaker (Individual) -> 7 days
     */
    async validateWaitPeriod(employerId: string, registerDate: Date, issueDate: Date) {
        const employer = await prisma.employer.findUnique({
            where: { id: employerId },
            include: {
                corporateInfo: true,
                individualInfo: true,
            }
        });

        if (!employer) {
            throw new Error('Employer not found');
        }

        const daysDiff = differenceInDays(startOfDay(issueDate), startOfDay(registerDate));

        // Default rule: 21 days for Industry, 7 days for Care
        let requiredDays = 21; // Default to stricter rule

        // Check if Corporate or Individual
        if (employer.individualInfo) {
            // Individual employers (usually caretakers) have 7 days wait period
            requiredDays = 7;
        } else if (employer.corporateInfo) {
            // Corporate employers (MFG, Construction) have 21 days
            // We could check corporateInfo.industryType if needed, but standard is 21.
            requiredDays = 21;
        }

        if (daysDiff < requiredDays) {
            return {
                valid: false,
                error: `未滿國內招募等待期。規定：${requiredDays} 天，實際：${daysDiff} 天。`
            };
        }

        return { valid: true };
    }
};
