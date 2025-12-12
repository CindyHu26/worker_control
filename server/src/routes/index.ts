import { Router } from 'express';
// Import specific route modules here
import dashboardRoutes from './dashboard';
import workerRoutes from './workers';
import authRoutes from './auth';
import recruitmentRoutes from './recruitment';
import employerRoutes from './employers';
import attachmentRoutes from './attachments';
import commentRoutes from './comments';
import documentRoutes from './documents';
import deploymentRoutes from './deployments';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/workers', workerRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/employers', employerRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/comments', commentRoutes);
router.use('/documents', documentRoutes);
router.use('/deployments', deploymentRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

export default router;
