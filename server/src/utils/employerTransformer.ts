import { parseTaiwanDate } from './dateUtils';

/**
 * Helper to parse numeric values safely
 */
const parseNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
};

/**
 * Helper to parse dates safely using the project's utility
 */
const parseDate = (value: any): Date | undefined => {
    if (!value || value === '0000-00-00' || value === '9999-12-31') return undefined;
    try {
        return parseTaiwanDate(value);
    } catch {
        return undefined;
    }
};

/**
 * Legacy CUxx Data Record
 */
export type LegacyEmployerRecord = Record<string, any>;

/**
 * Transformed Employer Object compatible with Prisma models
 */
export interface TransformedEmployer {
    code?: string;
    companyName: string;
    companyNameEn?: string;
    shortName?: string;
    taxId?: string;
    responsiblePerson?: string;
    address?: string;
    addressEn?: string;
    phoneNumber?: string;
    mobilePhone?: string;
    email?: string;
    contactPerson?: string;
    contactPhone?: string;
    referrer?: string;
    terminateDate?: Date;
    remarks?: string;
    industryAttributes?: Record<string, any>;
    agencyId?: string;
    corporateInfo?: {
        laborInsuranceNo?: string;
        healthInsuranceUnitNo?: string;
        factoryRegistrationNo?: string;
        faxNumber?: string;
        industryType?: string;
        industryCode?: string;
    };
    individualInfo?: {
        responsiblePersonDob?: Date;
        responsiblePersonIdNo?: string;
        englishName?: string;
        residenceZip?: string;
        residenceCityCode?: string;
        residenceAddress?: string;
        militaryStatus?: string;
        birthPlace?: string;
    };
    factories?: Array<{
        name: string;
        address?: string;
        addressEn?: string;
        zipCode?: string;
        cityCode?: string;
    }>;
}

/**
 * Transforms legacy CUxx record into our standard Prisma-friendly object
 */
export function transformLegacyEmployer(record: LegacyEmployerRecord): TransformedEmployer {
    const result: TransformedEmployer = {
        code: record.CU00,
        companyName: record.CU01,
        companyNameEn: record.CU01_E,
        shortName: record.CU44,
        taxId: record.CU04,
        responsiblePerson: record.CU02,
        address: record.CU05,
        addressEn: record.CU05_E,
        phoneNumber: record.CU06,
        mobilePhone: record.CU42 || record.CU34,
        email: record.CU41 || record.CU118,
        contactPerson: record.CU24,
        contactPhone: record.CU25,
        referrer: record.CU115,
        terminateDate: parseDate(record.CU35),
        remarks: record.CU43,
        industryAttributes: {
            applicationType: record.CU63,
            isForeigner: record.CU65,
            licenseExpiryDate: record.CU137,
            salesAgent: record.CU27,
            professionalStaff: record.CU102,
            adminStaff: record.CU62,
            accountant: record.CU112,
            source: record.CU132,
            domesticAgency: record.CU120,
            customerService: record.CU26,
            specialInstructions: record.CU123,
            legacyRef95: record.CU95,
            legacyRef96: record.CU96,
            timingReference: record.CU123
        }
    };

    // Corporate Info
    if (record.CU11 || record.CU29 || record.CU81) {
        result.corporateInfo = {
            laborInsuranceNo: record.CU11,
            healthInsuranceUnitNo: record.CU29,
            factoryRegistrationNo: record.CU81,
            faxNumber: record.CU07,
            industryCode: record.CU28
        };
    }

    // Individual Info
    if (record.CU13 || record.CU12) {
        result.individualInfo = {
            responsiblePersonIdNo: record.CU13,
            responsiblePersonDob: parseDate(record.CU12),
            englishName: record.CU02_E,
            residenceZip: record.CU021 || record.CU79,
            residenceCityCode: record.CU022 || record.CU80,
            residenceAddress: record.CU023 || record.CU78,
            militaryStatus: record.CU51,
            birthPlace: record.CU49 || record.CU59
        };
    }

    // Factories (Handling index 1 and 2 from hidden fields if present)
    const factories = [];
    if (record.CU053_1) {
        factories.push({
            name: record.CU054_1 || '一廠',
            address: record.CU053_1,
            addressEn: record.CU053_1E,
            zipCode: record.CU051_1,
            cityCode: record.CU052_1
        });
    }
    if (record.CU053_2) {
        factories.push({
            name: record.CU054_2 || '二廠',
            address: record.CU053_2,
            addressEn: record.CU053_2E,
            zipCode: record.CU051_2,
            cityCode: record.CU052_2
        });
    }
    if (factories.length > 0) {
        result.factories = factories;
    }

    return result;
}
