import type { Prisma } from '@prisma/client';
import { IEmployerTypeStrategy, ValidationResult } from './IEmployerTypeStrategy';
import { parseOptionalDate } from '../../utils/dateUtils';
import { parseNumber } from '../../utils/numberUtils';

/**
 * Strategy for Manufacturing Employers
 */
export class ManufacturingStrategy implements IEmployerTypeStrategy {
    getCategory(): string {
        return 'MANUFACTURING';
    }

    validate(data: any): ValidationResult {
        const errors: string[] = [];

        // Manufacturing-specific validations
        if (!data.companyName) {
            errors.push('Company name is required for manufacturing employers');
        }

        if (data.factories && data.factories.length > 0) {
            data.factories.forEach((factory: any, index: number) => {
                if (!factory.name) {
                    errors.push(`Factory ${index + 1}: Name is required`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    prepareCreateData(input: any): Prisma.EmployerCreateInput {
        const { factories, industryAttributes, ...coreData } = input;

        const data: any = {
            companyName: coreData.companyName,
            companyNameEn: coreData.companyNameEn,
            taxId: coreData.taxId,
            unitTaxId: coreData.unitTaxId,
            houseTaxId: coreData.houseTaxId,
            code: coreData.code,
            shortName: coreData.shortName,
            responsiblePerson: coreData.responsiblePerson,
            phoneNumber: coreData.phoneNumber,
            mobilePhone: coreData.mobilePhone,
            addressDetail: coreData.addressDetail || coreData.address,
            city: coreData.city,
            district: coreData.district,
            zipCode: coreData.zipCode,
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
            agency: coreData.agencyId ? { connect: { id: coreData.agencyId } } : undefined,
            remarks: coreData.remarks,
            category: coreData.category ? { connect: { code: coreData.category } } : undefined
        };

        // Corporate Info
        if (coreData.factoryRegistrationNo || coreData.industryType) {
            data.corporateInfo = {
                create: {
                    factoryRegistrationNo: coreData.factoryRegistrationNo,
                    industryType: coreData.industryType,
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
        }

        // Factories
        if (factories && factories.length > 0) {
            data.factories = {
                create: factories.map((f: any) => ({
                    name: f.name,
                    factoryRegNo: f.factoryRegNo,
                    taxId: f.taxId,
                    laborInsuranceNo: f.laborInsuranceNo,
                    healthInsuranceNo: f.healthInsuranceNo,
                    ranking: f.ranking,
                    addressDetail: f.addressDetail || f.address,
                    addressEn: f.addressEn,
                    zipCode: f.zipCode,
                    city: f.city,
                    district: f.district,
                    // cityCode: f.cityCode, // Is this legacy? Keeping if needed or removing if replaced by city/district
                    laborCount: parseNumber(f.laborCount) || 0,
                    foreignCount: parseNumber(f.foreignCount) || 0
                }))
            };
        }

        return data;
    }

    prepareUpdateData(input: any): Prisma.EmployerUpdateInput {
        // Similar logic to prepareCreateData but for updates
        // Using update/upsert patterns for nested relations
        const { factories, corporateInfo, ...coreData } = input;

        const data: any = {
            companyName: coreData.companyName,
            shortName: coreData.shortName,
            taxId: coreData.taxId,
            phoneNumber: coreData.phoneNumber,
            addressDetail: coreData.addressDetail || coreData.address,
            city: coreData.city,
            district: coreData.district,
            zipCode: coreData.zipCode,
            allocationRate: coreData.allocationRate ? parseNumber(coreData.allocationRate) : undefined,
            zeroFeeEffectiveDate: coreData.zeroFeeEffectiveDate ? parseOptionalDate(coreData.zeroFeeEffectiveDate) : undefined
        };

        // Update corporate info if provided
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
