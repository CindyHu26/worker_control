import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const user = await prisma.systemAccount.findUnique({
            where: { username },
            include: { systemRole: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials or account inactive' });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const roleName = user.systemRole?.name || 'staff';

        const token = jwt.sign(
            { id: user.id, username: user.username, role: roleName },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: roleName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
