import prisma from '../prisma';

/**
 * Global Data Context Builder for Document Generation
 * Fetches and flattens all relevant data for a given worker into a template-friendly structure.
 */
export async function buildWorkerDocumentContext(workerId: string) {
    // 1. Fetch Comprehensive Data
    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            // Foreign Agency
            foreignAgency: true,
            // Deployment & Employer
            deployments: {
                where: { status: { in: ['active', 'pending'] } },
                orderBy: { startDate: 'desc' },
                take: 1,
                include: {
                    employer: {
                        include: { agency: true }
                    },
                    monthlyFee: true, // For salary/fee details
                }
            },
            // Dormitory (Hierarchical)
            dormitory: true,
            bed: {
                include: {
                    room: {
                        include: { dormitory: true }
                    }
                }
            },
            // Documents
            passports: { orderBy: { issueDate: 'desc' } },
            arcs: { orderBy: { issueDate: 'desc' } },

            // History & Other Lists
            addressHistory: { orderBy: { startDate: 'desc' } },
            insurances: true,
            familyMembers: true, // Assuming this model will exist or mapped from fields
            emergencyContacts: true, // Assuming structure
        }
    });

    if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
    }

    // 2. Resolve Related Entities
    const defaultAgency = await prisma.agencyCompany.findFirst({ where: { isDefault: true } });
    const deployment = worker.deployments[0];
    const employer = deployment?.employer;

    // Agency logic: Employer's specific agency -> Default Agency -> Empty
    const agencyCompany = employer?.agency || defaultAgency || {} as any;
    const foreignAgency = worker.foreignAgency || {} as any;

    // Document logic
    const passport = worker.passports.find(p => p.isCurrent) || worker.passports[0];
    const arc = worker.arcs.find(a => a.isCurrent) || worker.arcs[0];

    // Dormitory Retrieval
    const dormBed = worker.bed;
    const dormRoom = dormBed?.room;
    const dormitory = dormRoom?.dormitory || worker.dormitory;

    // 3. Format Helpers
    const formatDate = (d: Date | null | undefined) => d ? new Date(d).toLocaleDateString() : '';
    const formatCurrency = (amt: any) => amt ? `NT$ ${Number(amt).toLocaleString()}` : '';
    const translateGender = (g: string | null) => {
        if (!g) return '';
        if (g.toLowerCase() === 'male' || g === 'M') return '男';
        if (g.toLowerCase() === 'female' || g === 'F') return '女';
        return g;
    };


    // Bilingual Salary Logic
    let salaryFormatted = formatCurrency(deployment?.basicSalary);
    const salary = deployment?.basicSalary ? Number(deployment.basicSalary) : 0;
    const nationality = worker.nationality;

    if (nationality === 'ID') {
        salaryFormatted = `NT$ ${salary} (IDR ${salary * 500} approx)`;
    } else if (nationality === 'VN') {
        salaryFormatted = `NT$ ${salary} (VND ${salary * 750} approx)`;
    } else if (nationality === 'PH') {
        salaryFormatted = `NT$ ${salary} (PHP ${salary * 1.8} approx)`;
    } else if (nationality === 'TH') {
        salaryFormatted = `NT$ ${salary} (THB ${salary * 1.1} approx)`;
    }

    // 4. Build Context Object
    const context: Record<string, any> = {
        // --- Worker (Basic) ---
        worker_id: worker.id,
        worker_name_en: worker.englishName,
        worker_name_cn: worker.chineseName || '',
        worker_nationality: worker.nationality,
        worker_gender: translateGender(worker.gender),
        worker_dob: formatDate(worker.dob),
        worker_mobile: worker.mobilePhone || '',
        worker_line_id: worker.lineId || '',
        worker_email: '', // Not in schema, placeholder
        worker_address_foreign: worker.foreignAddress || '',
        worker_education: worker.educationLevel || '',
        worker_religion: worker.religion || '',
        worker_marital_status: worker.maritalStatus || '',
        worker_height: worker.height || '',
        worker_weight: worker.weight || '',

        // --- ID Documents ---
        passport_no: passport?.passportNumber || '',
        passport_issue_date: formatDate(passport?.issueDate),
        passport_expiry_date: formatDate(passport?.expiryDate),
        passport_issue_place: passport?.issuePlace || '',

        arc_no: arc?.arcNumber || '',
        arc_issue_date: formatDate(arc?.issueDate),
        arc_expiry_date: formatDate(arc?.expiryDate),

        // --- Employer ---
        employer_name: employer?.companyName || '',
        employer_tax_id: employer?.taxId || '',
        employer_phone: employer?.phoneNumber || '',
        employer_address: employer?.address || '',
        employer_rep: employer?.responsiblePerson || '',
        employer_factory_address: employer?.factoryRegistrationId || '', // Check field mapping

        // --- Agency (Taiwan) ---
        agency_name: agencyCompany.name || '',
        agency_license_no: agencyCompany.licenseNo || '',
        agency_tax_id: agencyCompany.taxId || '',
        agency_address: agencyCompany.address || '',
        agency_phone: agencyCompany.phone || '',
        agency_fax: agencyCompany.fax || '',
        agency_email: agencyCompany.email || '',
        agency_rep: agencyCompany.responsiblePerson || '',

        // --- Foreign Agency ---
        foreign_agency_name: foreignAgency.name || '',
        foreign_agency_code: foreignAgency.code || '',
        foreign_agency_address: foreignAgency.address || '',
        foreign_agency_country: foreignAgency.country || '',

        // --- Deployment / Contract ---
        contract_start_date: formatDate(deployment?.startDate),
        contract_end_date: formatDate(deployment?.endDate),
        job_description: deployment?.jobDescription || '',
        basic_salary: formatCurrency(deployment?.basicSalary),
        worker_job_type: deployment?.jobType || '', // Caretaker, Factory, etc

        // --- Dormitory ---
        dorm_name: dormitory?.name || '',
        dorm_address: dormitory?.address || '',
        dorm_landlord: dormitory?.landlordName || '',
        dorm_room_no: dormRoom?.roomNumber || '',
        dorm_bed_code: dormBed?.bedCode || '',

        // --- System / Meta ---
        today: formatDate(new Date()),
        current_year: new Date().getFullYear(),
        current_month: new Date().getMonth() + 1,
        current_day: new Date().getDate(),

        // --- Loops / Lists ---
        address_history_list: worker.addressHistory.map(addr => ({
            type: addr.addressType,
            address: addr.addressDetail,
            start_date: formatDate(addr.startDate),
            end_date: formatDate(addr.endDate)
        })),

        // Placeholder for future models
        family_members_list: [],
        emergency_contact_list: (worker.emergencyContactPhone) ? [{
            name: 'Emergency Contact',
            phone: worker.emergencyContactPhone
        }] : []
    };

    return context;
}

/**
 * Returns a list of all available keys in the document context.
 * Used for template validation.
 */
export function getTemplateKeys(): string[] {
    return [
        // Worker
        'worker_id', 'worker_name_en', 'worker_name_cn', 'worker_nationality', 'worker_gender',
        'worker_dob', 'worker_mobile', 'worker_line_id', 'worker_email', 'worker_address_foreign',
        'worker_education', 'worker_religion', 'worker_marital_status', 'worker_height', 'worker_weight',

        // Documents
        'passport_no', 'passport_issue_date', 'passport_expiry_date', 'passport_issue_place',
        'arc_no', 'arc_issue_date', 'arc_expiry_date',

        // Employer
        'employer_name', 'employer_tax_id', 'employer_phone', 'employer_address', 'employer_rep', 'employer_factory_address',

        // Agency
        'agency_name', 'agency_license_no', 'agency_tax_id', 'agency_address', 'agency_phone', 'agency_fax', 'agency_email', 'agency_rep',

        // Foreign Agency
        'foreign_agency_name', 'foreign_agency_code', 'foreign_agency_address', 'foreign_agency_country',

        // Deployment
        'contract_start_date', 'contract_end_date', 'job_description', 'basic_salary', 'salary_formatted', 'worker_job_type', 'entry_date',

        // Dormitory
        'dorm_name', 'dorm_address', 'dorm_landlord', 'dorm_room_no', 'dorm_bed_code',

        // System
        'today', 'current_year', 'current_month', 'current_day',

        // Loops (Key names for loops are usually implied by Docxtemplater, but we list the array names)
        'address_history_list', 'family_members_list', 'emergency_contact_list'
    ];
}
