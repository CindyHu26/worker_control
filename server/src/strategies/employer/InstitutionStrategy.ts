import type { Prisma } from '@prisma/client';
import { IEmployerTypeStrategy, ValidationResult } from './IEmployerTypeStrategy';
import { parseOptionalDate } from '../../utils/dateUtils';
import { parseNumber } from '../../utils/numberUtils';

/**
 * Strategy for Institution Care Employers
 */
export class InstitutionStrategy implements IEmployerTypeStrategy {
    getCategory(): string {
        return 'INSTITUTION';
    }

    validate(data: any): ValidationResult {
        const errors: string[] = [];

        if (!data.companyName) {
            errors.push('Institution name is required');
        }

        // Institutions require corporate info
        if (!data.institutionCode) {
            errors.push('Institution code is required');
        }

        if (!data.bedCount || data.bedCount <= 0) {
            errors.push('Valid bed count is required for institutions');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    prepareCreateData(input: any): Prisma.EmployerCreateInput {
        const { factories, industryAttributes, ...coreData } = input;

        const data: Prisma.EmployerCreateInput = {
            companyName: coreData.companyName,
            companyNameEn: coreData.companyNameEn,
            taxId: coreData.taxId,
            code: coreData.code,
            shortName: coreData.shortName,
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

        // Corporate Info (required for institutions)
        data.corporateInfo = {
            create: {
                factoryRegistrationNo: coreData.factoryRegistrationNo,
                industryType: coreData.industryType || 'INSTITUTION',
                industryCode: coreData.industryCode,
                factoryAddress: coreData.factoryAddress,
                capital: parseNumber(coreData.capital),
                laborInsuranceNo: coreData.laborInsuranceNo,
                laborInsuranceId: coreData.laborInsuranceId,
                healthInsuranceUnitNo: coreData.healthInsuranceUnitNo,
                healthInsuranceId: coreData.healthInsuranceId,
                institutionCode: coreData.institutionCode,
                bedCount: parseNumber(coreData.bedCount),
                faxNumber: coreData.faxNumber
            }
        };

        return data;
    }

    prepareUpdateData(input: any): Prisma.EmployerUpdateInput {
        const { corporateInfo, ...coreData } = input;

        const data: Prisma.EmployerUpdateInput = {
            companyName: coreData.companyName,
            shortName: coreData.shortName,
            phoneNumber: coreData.phoneNumber,
            address: coreData.address
        };

        if (corporateInfo) {
            data.corporateInfo = {
                upsert: {
                    create: corporateInfo,
                    update: corporateInfo
                }
            };
        }

        return data;
    }
}
