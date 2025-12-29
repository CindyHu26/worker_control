import type { Prisma } from '@prisma/client';
import { IEmployerTypeStrategy, ValidationResult } from './IEmployerTypeStrategy';
import { parseOptionalDate } from '../../utils/dateUtils';
import { parseNumber } from '../../utils/numberUtils';

/**
 * Strategy for Home Care Employers (Individual)
 */
export class HomeCareStrategy implements IEmployerTypeStrategy {
    getCategory(): string {
        return 'HOME_CARE';
    }

    validate(data: any): ValidationResult {
        const errors: string[] = [];

        // Home care requires responsible person (applicant) info
        if (!data.responsiblePerson && !data.companyName) {
            errors.push('Applicant name is required for home care employers');
        }

        // Patient info validation
        if (!data.patientName) {
            errors.push('Patient name is required');
        }
        if (!data.patientIdNo) {
            errors.push('Patient ID number is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    prepareCreateData(input: any): Prisma.EmployerCreateInput {
        const { industryAttributes, ...coreData } = input;

        const data: Prisma.EmployerCreateInput = {
            companyName: coreData.companyName || coreData.responsiblePerson || '未命名',
            companyNameEn: coreData.companyNameEn,
            code: coreData.code,
            shortName: coreData.shortName,
            taxId: coreData.taxId,
            responsiblePerson: coreData.responsiblePerson,
            phoneNumber: coreData.phoneNumber,
            mobilePhone: coreData.mobilePhone,
            address: coreData.address,
            addressEn: coreData.addressEn,
            invoiceAddress: coreData.invoiceAddress,
            taxAddress: coreData.taxAddress,
            healthBillAddress: coreData.healthBillAddress,
            healthBillZip: coreData.healthBillZip,
            email: coreData.email,
            contactPerson: coreData.contactPerson,
            contactPhone: coreData.contactPhone,
            referrer: coreData.referrer,
            allocationRate: parseNumber(coreData.allocationRate),
            complianceStandard: coreData.complianceStandard || 'NONE',
            zeroFeeEffectiveDate: parseOptionalDate(coreData.zeroFeeEffectiveDate),
            industryAttributes: industryAttributes || coreData.industryAttributes,
            agencyId: coreData.agencyId,
            remarks: coreData.remarks,
            category: coreData.category ? { connect: { code: coreData.category } } : undefined
        };

        // Individual Info (required for home care)
        data.individualInfo = {
            create: {
                responsiblePersonIdNo: coreData.responsiblePersonIdNo || coreData.taxId,
                responsiblePersonDob: parseOptionalDate(coreData.responsiblePersonDob),
                responsiblePersonFather: coreData.responsiblePersonFather,
                responsiblePersonMother: coreData.responsiblePersonMother,
                responsiblePersonSpouse: coreData.responsiblePersonSpouse,
                englishName: coreData.englishName,
                birthPlace: coreData.birthPlace,
                birthPlaceEn: coreData.birthPlaceEn,
                residenceAddress: coreData.residenceAddress,
                residenceZip: coreData.residenceZip,
                residenceCityCode: coreData.residenceCityCode,
                militaryStatus: coreData.militaryStatus,
                militaryStatusEn: coreData.militaryStatusEn,
                idIssueDate: parseOptionalDate(coreData.idIssueDate),
                idIssuePlace: coreData.idIssuePlace,
                patientName: coreData.patientName,
                patientIdNo: coreData.patientIdNo,
                careAddress: coreData.careAddress,
                relationship: coreData.relationship
            }
        };

        return data;
    }

    prepareUpdateData(input: any): Prisma.EmployerUpdateInput {
        const { individualInfo, ...coreData } = input;

        const data: Prisma.EmployerUpdateInput = {
            companyName: coreData.companyName,
            shortName: coreData.shortName,
            phoneNumber: coreData.phoneNumber,
            address: coreData.address,
            responsiblePerson: coreData.responsiblePerson
        };

        if (individualInfo) {
            data.individualInfo = {
                upsert: {
                    create: individualInfo,
                    update: individualInfo
                }
            };
        }

        return data;
    }
}
