import { Router } from 'express';
// Import specific route modules here
import dashboardRoutes from './dashboard';
import workerRoutes from './workers';
import authRoutes from './auth';
import recruitmentRoutes from './recruitment';
import employerRoutes from './employers';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/workers', workerRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/employers', employerRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

export default router;
