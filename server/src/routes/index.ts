import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
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

import usersRoutes from './users';
import accountingRoutes from './accounting';
import jobsRoutes from './jobs';
import healthRoutes from './health';
import dormitoryRoutes from './dormitories';
import settingsRoutes from './settings';
import batchRoutes from './batch';
import notificationsRoutes from './notifications';
import exportsRoutes from './exports';
import kanbanRoutes from './kanban';
import searchRoutes from './search';

const router = Router();



router.use('/auth', authRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

// All routes after this middleware require authentication
router.use(authenticateToken);

router.use('/dashboard', dashboardRoutes);
router.use('/workers', workerRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/employers', employerRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/comments', commentRoutes);
router.use('/documents', documentRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/users', usersRoutes);
router.use('/accounting', accountingRoutes);
router.use('/jobs', jobsRoutes);
router.use('/health-checks', healthRoutes);
router.use('/dormitories', dormitoryRoutes);
router.use('/settings', settingsRoutes);
router.use('/batch', batchRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/exports', exportsRoutes);
router.use('/kanban', kanbanRoutes);
router.use('/search', searchRoutes);

export default router;
