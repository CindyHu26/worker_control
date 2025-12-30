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
            invoiceCity: coreData.invoiceCity,
            invoiceDistrict: coreData.invoiceDistrict,
            invoiceAddressDetail: coreData.invoiceAddressDetail || coreData.invoiceAddress,
            invoiceZipCode: coreData.invoiceZipCode,

            taxCity: coreData.taxCity,
            taxDistrict: coreData.taxDistrict,
            taxAddressDetail: coreData.taxAddressDetail || coreData.taxAddress,
            taxZipCode: coreData.taxZipCode,

            healthBillCity: coreData.healthBillCity,
            healthBillDistrict: coreData.healthBillDistrict,
            healthBillAddressDetail: coreData.healthBillAddressDetail || coreData.healthBillAddress,
            healthBillZipCode: coreData.healthBillZipCode || coreData.healthBillZip,
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

        // Corporate Info (required for institutions)
        data.corporateInfo = {
            create: {
                factoryRegistrationNo: coreData.factoryRegistrationNo,
                industryType: coreData.industryType || 'INSTITUTION',
                industryCode: coreData.industryCode,
                factoryCity: coreData.factoryCity,
                factoryDistrict: coreData.factoryDistrict,
                factoryAddressDetail: coreData.factoryAddressDetail || coreData.factoryAddress,
                factoryZipCode: coreData.factoryZipCode,
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
                    factoryCity: f.city || f.factoryCity,
                    factoryDistrict: f.district || f.factoryDistrict,
                    factoryAddressDetail: f.addressDetail || f.address || f.factoryAddress || f.factoryAddressDetail,
                    factoryZipCode: f.zipCode || f.factoryZipCode,
                    factoryFullAddressEn: f.addressEn,
                    cityCode: f.cityCode,
                    laborCount: parseNumber(f.laborCount) || 0,
                    foreignCount: parseNumber(f.foreignCount) || 0
                }))
            };
        }

        return data;
    }

    prepareUpdateData(input: any): Prisma.EmployerUpdateInput {
        const { corporateInfo, ...coreData } = input;

        const data: any = {
            companyName: coreData.companyName,
            shortName: coreData.shortName,
            phoneNumber: coreData.phoneNumber,
            addressDetail: coreData.addressDetail || coreData.address,
            city: coreData.city,
            district: coreData.district,
            zipCode: coreData.zipCode
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
