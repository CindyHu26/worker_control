
import express from 'express';
import { z } from 'zod';
import * as departmentService from '../services/departmentService';

const router = express.Router();

const departmentSchema = z.object({
    code: z.string().min(1, '代碼為必填'),
    nameZh: z.string().min(1, '中文名稱為必填'),
    nameEn: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

// GET /api/departments
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await departmentService.getDepartments(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '無法取得部門列表' });
    }
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
    try {
        const department = await departmentService.getDepartmentById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: '找不到部門' });
        }
        res.json(department);
    } catch (error) {
        res.status(500).json({ error: '無法顯示部門' });
    }
});

// POST /api/departments
router.post('/', async (req, res) => {
    try {
        const validatedData = departmentSchema.parse(req.body);
        const newDepartment = await departmentService.createDepartment(validatedData);
        res.status(201).json(newDepartment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '建立部門失敗' });
    }
});

// PATCH /api/departments/:id
router.patch('/:id', async (req, res) => {
    try {
        const validatedData = departmentSchema.partial().parse(req.body);
        const updatedDepartment = await departmentService.updateDepartment(req.params.id, validatedData);
        res.json(updatedDepartment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '更新部門失敗' });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', async (req, res) => {
    try {
        await departmentService.deleteDepartment(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        // Prisma explicit error handling for constraints could go here
        res.status(500).json({ error: '刪除部門失敗' });
    }
});

export default router;
