import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as employeeService from '../services/employeeService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, '代碼為必填').max(18),
    fullName: z.string().min(1, '中文姓名為必填').max(50),
    fullNameEn: z.string().max(100).optional().nullable(),
    gender: z.string().max(10).optional().nullable(),
    nationality: z.string().max(20).optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    idNumber: z.string().max(20).optional().nullable(),

    // Job Info
    departmentCode: z.string().max(10).optional().nullable(),
    employeeNumber: z.string().max(10).optional().nullable(),
    jobTitle: z.string().max(50).optional().nullable(),
    domesticAgencyId: z.string().uuid().optional().nullable(),

    // Contact
    phone: z.string().max(30).optional().nullable(),
    mobilePhone: z.string().max(30).optional().nullable(),
    extension: z.string().max(12).optional().nullable(),
    email: z.string().email('請輸入有效的電子郵件').or(z.literal('')).optional().nullable(),
    receiveSms: z.boolean().default(false),

    // Contact Person
    contactPerson: z.string().max(50).optional().nullable(),
    contactPhone: z.string().max(30).optional().nullable(),

    // Address
    mailingAddressZh: z.string().max(200).optional().nullable(),
    mailingAddressEn: z.string().max(200).optional().nullable(),
    residentialAddressZh: z.string().max(200).optional().nullable(),
    residentialAddressEn: z.string().max(200).optional().nullable(),

    // Emergency Contact
    emergencyContact: z.string().max(50).optional().nullable(),
    emergencyPhone: z.string().max(30).optional().nullable(),

    // Roles
    isSales: z.boolean().default(false),
    isAdmin: z.boolean().default(false),
    isCustomerService: z.boolean().default(false),
    isAccounting: z.boolean().default(false),
    isBilingual: z.boolean().default(false),

    // Sales Related
    employerAutoCode: z.string().max(10).optional().nullable(),
    contractCode: z.string().max(4).optional().nullable(),
    contractSeqUsed: z.number().int().optional().nullable(),
    salesGroupCode: z.string().max(10).optional().nullable(),
    expertise: z.string().max(200).optional().nullable(),

    // Bank Info
    postalAccountNo: z.string().max(12).optional().nullable(),
    postalAccountName: z.string().max(100).optional().nullable(),
    bankName: z.string().max(100).optional().nullable(),
    bankAccountName: z.string().max(100).optional().nullable(),
    bankAccountNo: z.string().max(20).optional().nullable(),

    // Employment Dates
    hireDate: z.string().optional().nullable(),
    insuranceStartDate: z.string().optional().nullable(),
    resignationDate: z.string().optional().nullable(),
    insuranceEndDate: z.string().optional().nullable(),

    // Notes
    notes: z.string().optional().nullable(),

    // Status
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await employeeService.getEmployees(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);

        // Convert date strings to Date objects
        const dataToCreate: any = { ...validatedData };
        if (validatedData.dateOfBirth) {
            dataToCreate.dateOfBirth = new Date(validatedData.dateOfBirth);
        }
        if (validatedData.hireDate) {
            dataToCreate.hireDate = new Date(validatedData.hireDate);
        }
        if (validatedData.insuranceStartDate) {
            dataToCreate.insuranceStartDate = new Date(validatedData.insuranceStartDate);
        }
        if (validatedData.resignationDate) {
            dataToCreate.resignationDate = new Date(validatedData.resignationDate);
        }
        if (validatedData.insuranceEndDate) {
            dataToCreate.insuranceEndDate = new Date(validatedData.insuranceEndDate);
        }

        // Handle domestic agency relation
        if (validatedData.domesticAgencyId) {
            dataToCreate.domesticAgency = {
                connect: { id: validatedData.domesticAgencyId }
            };
            delete dataToCreate.domesticAgencyId;
        }

        const newEmployee = await employeeService.createEmployee(dataToCreate);
        res.status(201).json(newEmployee);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);

        // Convert date strings to Date objects
        const dataToUpdate: any = { ...validatedData };
        if (validatedData.dateOfBirth) {
            dataToUpdate.dateOfBirth = new Date(validatedData.dateOfBirth);
        }
        if (validatedData.hireDate) {
            dataToUpdate.hireDate = new Date(validatedData.hireDate);
        }
        if (validatedData.insuranceStartDate) {
            dataToUpdate.insuranceStartDate = new Date(validatedData.insuranceStartDate);
        }
        if (validatedData.resignationDate) {
            dataToUpdate.resignationDate = new Date(validatedData.resignationDate);
        }
        if (validatedData.insuranceEndDate) {
            dataToUpdate.insuranceEndDate = new Date(validatedData.insuranceEndDate);
        }

        // Handle domestic agency relation
        if (validatedData.domesticAgencyId !== undefined) {
            if (validatedData.domesticAgencyId) {
                dataToUpdate.domesticAgency = {
                    connect: { id: validatedData.domesticAgencyId }
                };
            } else {
                dataToUpdate.domesticAgency = {
                    disconnect: true
                };
            }
            delete dataToUpdate.domesticAgencyId;
        }

        const updatedEmployee = await employeeService.updateEmployee(req.params.id, dataToUpdate);
        res.json(updatedEmployee);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await employeeService.deleteEmployee(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

export default router;
