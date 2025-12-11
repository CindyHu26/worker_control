import { Router } from 'express';
// Import specific route modules here
import dashboardRoutes from './dashboard';
import workerRoutes from './workers';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/workers', workerRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

export default router;
