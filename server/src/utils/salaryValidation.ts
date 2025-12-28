export class SalaryValidationError extends Error {
    constructor(public message: string, public details?: any) {
        super(message);
        this.name = 'SalaryValidationError';
    }
}

export const SALARY_THRESHOLDS = {
    // General Minimum (2024)
    GENERAL_MIN: 27470,

    // Intermediate Skilled Workers (Mid-Level)
    MID_INDUSTRY: 33000,
    MID_INSTITUTION_CARE: 29000,
    MID_HOME_CARE: 24000,
};

export function validateSalary(
    category: string,
    salary: number,
    isIntermediate: boolean = false
): void {
    if (!salary || salary < 0) {
        throw new SalaryValidationError('薪資金額錯誤 (Invalid Salary Amount)');
    }

    // 1. General Minimum Wage Check
    if (salary < SALARY_THRESHOLDS.GENERAL_MIN && category !== 'HOME_CARE' && category !== 'HOME_HELPER') {
        // Home Care is excluded from Labor Standards Act minimum wage usually, but has its own threshold (e.g. 17k -> 20k -> 24k now?)
        // Actually current law for Home Care is 20,000 (standard) but we focus on Intermediate here mainly.
        // Let's stick to the requested check logic.
        throw new SalaryValidationError(`一般勞工薪資不得低於基本工資 ${SALARY_THRESHOLDS.GENERAL_MIN}`);
    }

    // 2. Intermediate Worker Check
    if (isIntermediate) {
        // Industry (Manufacturing, Construction, Agriculture, Slaughter, Outreach)
        if (['MID_MANUFACTURING', 'MID_CONSTRUCTION', 'MID_AGRICULTURE', 'MID_AGRICULTURE_OUTREACH', 'MID_SLAUGHTER', 'MID_FISHERY'].includes(category)) {
            if (salary < SALARY_THRESHOLDS.MID_INDUSTRY) {
                throw new SalaryValidationError(`中階技術產業類薪資不得低於 ${SALARY_THRESHOLDS.MID_INDUSTRY} 元`);
            }
        }
        // Institutional Care
        else if (['MID_INSTITUTION'].includes(category)) {
            if (salary < SALARY_THRESHOLDS.MID_INSTITUTION_CARE) {
                throw new SalaryValidationError(`中階技術機構看護薪資不得低於 ${SALARY_THRESHOLDS.MID_INSTITUTION_CARE} 元 (或依各別規定)`);
            }
        }
        // Home Care
        else if (['MID_HOME_CARE'].includes(category)) {
            if (salary < SALARY_THRESHOLDS.MID_HOME_CARE) {
                throw new SalaryValidationError(`中階技術家庭看護薪資不得低於 ${SALARY_THRESHOLDS.MID_HOME_CARE} 元`);
            }
        }
    }
}
