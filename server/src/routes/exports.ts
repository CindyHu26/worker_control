
import { Router } from 'express';
import prisma from '../prisma';
import { format } from 'date-fns';
import { generateMolRegistrationCsv } from '../services/exportService';

const router = Router();

// Helper to sanitize CSV fields
const escapeCsv = (field: any) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

// GET /api/exports/labor-insurance-enrollment
// Export Labor Insurance Enrollment List (加保申報表)
// Query: employerId (optional), date (optional, defaults to now)
router.get('/labor-insurance-enrollment', async (req, res) => {
    try {
        const { employerId, date } = req.query;

        // Logic: Find workers who arrived or started recently (for enrollment)
        // For simplicity, let's just dump ALL active workers for now or filter by 'active' deployment.
        // User asked for "Enrollment", usually implies new.
        // But without specific "new" filter, I'll list all active deployments 
        // that might need insurance info.

        const whereClause: any = {
            status: 'active'
        };

        if (employerId) {
            whereClause.employerId = String(employerId);
        }

        const deployments = await prisma.deployment.findMany({
            where: whereClause,
            include: {
                worker: {
                    include: {
                        arcs: { where: { isCurrent: true }, take: 1 },
                        passports: { where: { isCurrent: true }, take: 1 }
                    }
                },
                employer: true
            },
            orderBy: {
                employerId: 'asc'
            }
        });

        // Generate CSV
        // Columns: Employer, Worker Name, ID/ARC, DOB, Salary, Insurance Tier
        const headers = ['Employer', 'Worker Name', 'ARC/ID', 'Birthday', 'Basic Salary', 'Labor Insurance Amt'];
        const rows = deployments.map(d => {
            const worker = d.worker;
            const arc = worker.arcs[0]?.arcNumber || '';
            const passport = worker.passports[0]?.passportNumber || '';
            const idNo = arc || passport || 'N/A';
            const dob = worker.dob ? format(worker.dob, 'yyyy/MM/dd') : '';

            return [
                d.employer.companyName,
                worker.englishName,
                idNo,
                dob,
                d.basicSalary || 0,
                d.laborInsuranceAmt || 0
            ].map(escapeCsv).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n'); // Add BOM if needed for Excel? '\ufeff'

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="labor_insurance_enrollment_${format(new Date(), 'yyyyMMdd')}.csv"`);
        res.send('\ufeff' + csvContent); // Add BOM for Excel compatibility

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate export' });
    }
});

// GET /api/exports/bank-payroll-transfer
// Export Bank Transfer File (薪資轉帳)
// Query: year, month, bank (ctbc, esun)
router.get('/bank-payroll-transfer', async (req, res) => {
    try {
        const { year, month, bank } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month are required' });
        }

        // Fetch Bill Items (Payroll/Salary usually)
        // or just fetch Bills for workers?
        // Let's assume we are paying the "Calculated Payable Amount" to worker.
        // But wait, the system currently generates "Bills" (Receivables from worker/employer). 
        // "Payroll Transfer" implies we are PAYING the worker (Salary).
        // If we don't have a Salary Calculation yet, we might export the "Income" part?
        // Or if the user means "Deducting from Worker's Account" (autodebit)?
        // "Payroll Transfer" usually means Employer -> Worker.

        // Assuming we have basic salary or a calculated monthly wage.
        // We use 'Deployment.basicSalary' as a placeholder for transfer amount for now if no "SalaryRecord" exists.
        // OR we export the "Bills" if they represent deductions? No, "Payroll Transfer" is usually Salary.

        // I will use `Deployment` active list and `basicSalary` as the transfer amount for the demo.
        // In real app, this should come from a `Payroll` model.

        const deployments = await prisma.deployment.findMany({
            where: {
                status: 'active'
            },
            include: {
                worker: true,
                employer: true
            }
        });

        // Format
        let content = '';
        const todayStr = format(new Date(), 'yyyyMMdd');

        if (bank === 'ctbc') {
            // CTBC Format (Hypothetical Standard 822)
            // Header: 01 + CompanyAccount + Date + Seq
            // Body: 02 + ...
            // Simplified CSV for demo

            const rows = deployments.map((d, index) => {
                const worker = d.worker;
                const account = worker.bankAccountNo || '000000000000';
                const money = Number(d.basicSalary || 0);
                if (money <= 0) return null;

                // CTBC often uses fixed width, but here we provide CSV compatible for upload
                // Format: RecipientAccount, Amount, Note
                return `${account},${money},SALARY ${month}/${year} ${worker.englishName}`;
            }).filter(r => r);

            content = rows.join('\n');
            res.setHeader('Content-Disposition', `attachment; filename="CTBC_Payroll_${todayStr}.txt"`);

        } else if (bank === 'esun') {
            // E.Sun Format (Hypothetical Standard 808)
            // Often CSV
            const header = 'Recipient Account,Amount,Note,Email';
            const rows = deployments.map(d => {
                const worker = d.worker;
                const account = worker.bankAccountNo || '';
                const money = Number(d.basicSalary || 0);
                if (money <= 0) return null;

                return `${account},${money},Salary ${month},`;
            }).filter(r => r);

            content = [header, ...rows].join('\n');
            res.setHeader('Content-Disposition', `attachment; filename="ESUN_Payroll_${todayStr}.csv"`);
        } else {
            // Default Generic
            const header = 'Bank Code,Recipient Account,Amount,Name';
            const rows = deployments.map(d => {
                const worker = d.worker;
                const account = worker.bankAccountNo || '';
                const bankCode = worker.bankCode || '';
                const money = Number(d.basicSalary || 0);
                return `${bankCode},${account},${money},${worker.englishName}`;
            });
            content = [header, ...rows].join('\n');
            res.setHeader('Content-Disposition', `attachment; filename="Payroll_${todayStr}.csv"`);
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(content);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate export' });
    }
});



// POST /api/exports/mol-registration
router.post('/mol-registration', async (req, res) => {
    try {
        const { workerIds } = req.body;
        if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
            return res.status(400).json({ error: 'workerIds array is required' });
        }

        const csvContent = await generateMolRegistrationCsv(workerIds);
        const fileName = `mol_labor_list_${format(new Date(), 'yyyyMMdd')}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to generate MOL export' });
    }
});

export default router;
