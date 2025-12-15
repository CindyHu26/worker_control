import prisma from '../prisma';

/**
 * Global Data Context Builder for Document Generation
 * Fetches and flattens all relevant data for a given worker into a template-friendly structure.
 */
export const buildWorkerDocumentContext = async (workerId: string, overrides: Record<string, any> = {}): Promise<any> => {
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
                        include: {
                            agency: true,
                            laborCounts: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 } // Fetch for 3K5
                        }
                    },
                    monthlyFee: true, // For salary/fee details
                    entryPermit: {
                        include: {
                            recruitmentLetter: true
                        }
                    }
                }
            },
            // Dormitory (Hierarchical)
            dormitory: {
                include: { rooms: true }
            },
            bed: {
                include: {
                    room: {
                        include: {
                            dormitory: {
                                include: { rooms: true }
                            }
                        }
                    }
                }
            },
            // Documents
            passports: { orderBy: { issueDate: 'desc' } },
            arcs: { orderBy: { issueDate: 'desc' } },

            // History & Other Lists
            addressHistory: { orderBy: { startDate: 'desc' } },
            insurances: true,
            // familyMembers: true, // Removed: Not in schema
            // emergencyContacts: true, // Removed: Not in schema
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

    // 3K5 Stats Calculation
    // Logic: Average of last 12 months (or available months if < 12)
    const laborCounts = employer?.laborCounts || [];
    let avgLaborCount = 0;
    if (laborCounts.length > 0) {
        // Sort by year/month desc to take recent 12?
        // Basic average for now
        const total = laborCounts.reduce((sum: number, item: any) => sum + item.count, 0);
        avgLaborCount = Math.floor(total / laborCounts.length);
    }

    // Application Type Logic
    // We judge "is_recruit_permit" if we have a valid RecruitmentLetter linked via EntryPermit
    // But actually, M343 is used for BOTH.
    // If we are in "Recruitment" stage -> Recruit Permit.
    // If we are in "Hiring" stage -> Employ Permit.
    // Let's use checking of specific fields to determine Context flags.

    // Retrieve Recruitment Letter info if available
    const entryPermit = deployment?.entryPermit;
    const recruitmentLetter = entryPermit?.recruitmentLetter;

    const isRecruitPermit = !!recruitmentLetter; // Simplify: If we have linked recruitment letter info
    const isEmployPermit = !!deployment?.employmentPermitReceiptNo || !!deployment?.employmentPermitDate;

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

        // --- Visa / Entry ---
        visa_no: deployment?.visaNumber || '',
        entry_date: formatDate(deployment?.entryDate),
        flight_no: deployment?.flightNumber || '',

        // --- Employer ---
        employer_name: employer?.companyName || '',
        employer_tax_id: employer?.taxId || '',
        employer_phone: employer?.phoneNumber || '',
        employer_address: employer?.address || '',
        employer_rep: employer?.responsiblePerson || '',
        employer_factory_address: employer?.factoryRegistrationId || '', // Check field mapping

        // 3K5 Stats
        avg_labor_count: avgLaborCount,
        allocation_rate: employer?.allocationRate ? Number(employer.allocationRate) : 0,
        qualified_count: employer?.totalQuota || 0,

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

        // Application / Permit Info
        is_recruit_permit: isRecruitPermit,
        is_employ_permit: isEmployPermit,
        chk_recruit_permit: isRecruitPermit ? '☑' : '☐',
        chk_employ_permit: isEmployPermit ? '☑' : '☐',

        // Review Fee
        receipt_no: isEmployPermit ? deployment?.employmentPermitReceiptNo : recruitmentLetter?.reviewFeeReceiptNo || '',
        pay_date: formatDate(isEmployPermit ? deployment?.employmentPermitDate : recruitmentLetter?.reviewFeeDate),
        amount: isEmployPermit ? deployment?.employmentPermitAmount : recruitmentLetter?.reviewFeeAmount || 0,

        // --- Dormitory ---
        dorm_name: dormitory?.name || '',
        dorm_address: dormitory?.address || '',
        dorm_landlord: dormitory?.landlordName || '',
        dorm_room_no: dormRoom?.roomNumber || '',
        dorm_bed_code: dormBed?.bedCode || '',

        is_dorm: !!dormitory, // Live in dorm
        is_self_arranged: !dormitory, // Live outside
        chk_dorm: !!dormitory ? '☑' : '☐',
        chk_self_arranged: !dormitory ? '☑' : '☐',

        // Dorm Compliance
        dorm_type: dormitory?.accommodationType || '',
        total_area: dormitory?.totalArea ? Number(dormitory.totalArea) : 0,
        room_count: dormitory?.rooms?.length || 0, // Need to verify if rooms are fetched
        bathroom_count: dormitory?.bathroomCount || 0,
        heater_count: dormitory?.waterHeaterCount || 0,
        avg_area_per_person: (dormitory?.totalArea && dormitory?.capacity) ? (Number(dormitory.totalArea) / dormitory.capacity).toFixed(2) : 0,

        has_fire_ext: dormitory?.hasFireExtinguisher,
        has_fire_alarm: dormitory?.hasFireAlarm,
        chk_fire_ext: dormitory?.hasFireExtinguisher ? '☑' : '☐',
        chk_fire_alarm: dormitory?.hasFireAlarm ? '☑' : '☐',

        // Food / Boarding
        food_provider: deployment?.foodStatus || '',
        food_cost: deployment?.foodAmount ? Number(deployment.foodAmount) : 0,

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

    // --- FINAL CONTEXT MERGE ---
    return {
        ...context,
        ...overrides // Apply Manual Overrides (e.g. Custom Dates, Address)
    };
};

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
        'visa_no', 'flight_no',

        // Employer
        'employer_name', 'employer_tax_id', 'employer_phone', 'employer_address', 'employer_rep', 'employer_factory_address',
        'avg_labor_count', 'allocation_rate', 'qualified_count',

        // App Info
        'is_recruit_permit', 'is_employ_permit', 'chk_recruit_permit', 'chk_employ_permit',
        'receipt_no', 'pay_date', 'amount',

        // Agency
        'agency_name', 'agency_license_no', 'agency_tax_id', 'agency_address', 'agency_phone', 'agency_fax', 'agency_email', 'agency_rep',

        // Foreign Agency
        'foreign_agency_name', 'foreign_agency_code', 'foreign_agency_address', 'foreign_agency_country',

        // Deployment
        'contract_start_date', 'contract_end_date', 'job_description', 'basic_salary', 'salary_formatted', 'worker_job_type', 'entry_date',
        'food_provider', 'food_cost',

        // Dormitory
        'dorm_name', 'dorm_address', 'dorm_landlord', 'dorm_room_no', 'dorm_bed_code',
        'is_dorm', 'is_self_arranged', 'chk_dorm', 'chk_self_arranged',
        'dorm_type', 'total_area', 'room_count', 'bathroom_count', 'heater_count', 'avg_area_per_person',
        'has_fire_ext', 'has_fire_alarm', 'chk_fire_ext', 'chk_fire_alarm',

        // System
        'today', 'current_year', 'current_month', 'current_day',

        // Loops (Key names for loops are usually implied by Docxtemplater, but we list the array names)
        'address_history_list', 'family_members_list', 'emergency_contact_list',

        // Batch
        'workers'
    ];
}

/**
 * Builds a context for a Batch Document (e.g. Notification of Arrival List).
 * Aggregates multiple worker contexts into a single object with a 'workers' array.
 */
export async function buildBatchDocumentContext(workerIds: string[]) {
    if (!workerIds || workerIds.length === 0) {
        throw new Error('No worker IDs provided for batch generation');
    }

    // Generate individual contexts (Parallel)
    const contexts = await Promise.all(workerIds.map(id => buildWorkerDocumentContext(id)));

    // Use the first worker's context as the "Header" source (Employer, Agency, etc.)
    // Assumption: Batch reports are homogeneous (Same Employer).
    if (contexts.length === 0) return {};

    const baseContext = { ...contexts[0] };

    // Inject the array for loops
    // We map the flat context to an object in the 'workers' array
    // Docxtemplater uses {#workers} {name} {/workers}
    // Since 'contexts' are already objects with 'worker_name_en' etc., we can reuse them.
    // However, the spec might want simpler keys like 'name' inside the loop?
    // The spec JSON said: "workers": [ { "name": "worker.englishName" ... } ]
    // Let's providing the FULL context for each worker in the array, plus aliases if needed.

    baseContext.workers = contexts.map((c, index) => ({
        ...c,
        index: index + 1, // 1-based index
        // Aliases for shorter templates if desired, or just use full keys
        name: c.worker_name_en, // Alias
        passport: c.passport_no
    }));

    // Aggregate Stats
    baseContext.total_workers = contexts.length;

    return baseContext;
}
