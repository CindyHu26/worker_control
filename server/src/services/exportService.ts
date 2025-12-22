import { stringify } from 'csv-stringify/sync';
import prisma from '../prisma';
import { format } from 'date-fns';

// Nationality Mapping
// IDN (印尼) -> 009
// VNM (越南) -> 033
// PHL (菲律賓) -> 024
// THA (泰國) -> 030
// MYS (馬來西亞) -> 019
// MNG (蒙古) -> 021
const NATIONALITY_MAP: Record<string, string> = {
    'IDN': '009',
    'VN': '033', // Assuming system uses VN for Vietnam
    'VNM': '033',
    'PH': '024', // Assuming PH
    'PHL': '024',
    'TH': '030', // Assuming TH
    'THA': '030',
    'MYS': '019',
    'MNG': '021'
};

const mapNationality = (nat: string): string => {
    return NATIONALITY_MAP[nat] || '';
};

// Date Format: YYYYMMDD
const formatDateMol = (date: Date | null | undefined): string => {
    if (!date) return ''; // Requirement: Empty if no date
    return format(date, 'yyyyMMdd');
};

// Gender Format: M/F (First char of Male/Female)
const mapGender = (gender: string | null): string => {
    if (!gender) return '';
    const g = gender.toUpperCase();
    if (g.startsWith('M')) return 'M';
    if (g.startsWith('F')) return 'F';
    return g;
};

export const generateMolRegistrationCsv = async (workerIds: string[]): Promise<string> => {
    // 1. Fetch Workers
    const workers = await prisma.worker.findMany({
        where: { id: { in: workerIds } },
        include: {
            deployments: {
                where: { status: { in: ['active', 'pending'] } },
                orderBy: { startDate: 'desc' },
                take: 1
            },
            passports: {
                where: { isCurrent: true },
                take: 1
            }
        }
    });

    // 2. Map Data to Rows
    // Header: 國籍,護照號碼,姓名,性別,入境日
    const rows = workers.map((w: any) => {
        const deployment = w.deployments[0];
        const passport = w.passports[0]; // Assuming passport info is needed

        // Nationality
        const nationalityCode = mapNationality(w.nationality);

        // Passport No
        const passportNo = passport?.passportNumber || w.oldPassportNumber || '';

        // Name
        const name = w.englishName;

        // Gender
        const gender = mapGender(w.gender);

        // Entry Date
        // Priority: Deployment.entryDate -> Worker.flightArrivalDate (not in common schema, maybe custom?)
        // Let's verify schema for 'flightArrivalDate'. If not found, revert to deployment entryDate.
        // Based on previous schema views, deployment has 'entryDate'.
        const entryDate = formatDateMol(deployment?.entryDate);

        return {
            '國籍': nationalityCode,
            '護照號碼': passportNo,
            '姓名': name,
            '性別': gender,
            '入境日': entryDate
        };
    });

    // 3. Generate CSV
    // csv-stringify handles quoting automatically
    const csvContent = stringify(rows, {
        header: true,
        columns: ['國籍', '護照號碼', '姓名', '性別', '入境日'],
        bom: true // Add BOM for Excel compatibility as requested
    });

    return csvContent;
};
