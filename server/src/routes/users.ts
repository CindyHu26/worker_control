import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Validation Schemas
const createUserSchema = z.object({
    username: z.string().min(3),
    name: z.string().min(1, '姓名為必填'),
    password: z.string().min(8, '密碼長度不足 (Password too short)'),
    role: z.enum(['admin', 'manager', 'staff'])
});

const updateUserSchema = z.object({
    role: z.enum(['admin', 'manager', 'staff']).optional(),
    password: z.string().min(8).optional(),
    name: z.string().min(1).optional()
});

// GET /api/users - List users
router.get('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
    try {
        const accounts = await prisma.internalUser.findMany({
            orderBy: { username: 'asc' },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        res.json(accounts);
    } catch (error) {
        console.error('List Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users - Create user
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);

        // Check duplicate
        const existing = await prisma.internalUser.findUnique({
            where: { username: data.username }
        });

        if (existing) {
            return res.status(409).json({ error: '使用者名稱已存在' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.internalUser.create({
            data: {
                username: data.username,
                passwordHash: hashedPassword,
                role: data.role as UserRole,
                name: data.name
            },
            select: { id: true, username: true, role: true, name: true }
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Create User Error Full Object:', JSON.stringify(error, null, 2));

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
        }
        // Check for Prisma unique constraint error
        if ((error as any).code === 'P2002') {
            return res.status(409).json({ error: 'Unique constraint failed: ' + (error as any).meta?.target });
        }
        res.status(500).json({ error: 'Failed to create user', details: (error as Error).message });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);

        let updateData: any = {};
        if (data.role) updateData.role = data.role;
        if (data.name) updateData.name = data.name;
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        const updated = await prisma.internalUser.update({
            where: { id },
            data: updateData,
            select: { id: true, username: true, role: true, name: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ error: 'Failed to update user', details: (error as Error).message });
    }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.internalUser.delete({
            where: { id }
        });
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
