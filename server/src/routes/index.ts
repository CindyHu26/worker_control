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

import evaluationRoutes from './evaluation';
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
import quotaRoutes from './quota';
import taxRoutes from './tax';

import complianceRoutes from './compliance';
import leadsRoutes from './leads';
import taxConfigRoutes from './taxConfig';
const router = Router();




router.use('/auth', authRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

// All routes after this middleware require authentication
router.use(authenticateToken);

router.use('/dashboard', dashboardRoutes);
router.use('/workers', evaluationRoutes);
router.use('/workers', workerRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/employers', employerRoutes);
// Mount under employers for correct pathing: /api/employers/:id/labor-counts -> quotaRoutes relative path handling needed?
// quotaRoutes is defined as router.post('/:id/labor-counts').
// If we mount at /employers, then /api/employers/:id/labor-counts works if quotaRoutes handles just the subpath.
// But wait, quotaRoutes uses `router.post('/:id/labor-counts')`.
// If I mount `router.use('/employers', quotaRoutes)`, then request to `/api/employers/:id/labor-counts` matches.
// However, `employerRoutes` handles `/employers` too. Express matches in order.
// `employerRoutes` likely handles `/:id` etc.
// Better to mount quotaRoutes BEFORE employerRoutes if there are potential conflicts, or mount it as a separate path or merge them.
// Let's check `employerRoutes`. If it has `/:id`, it might catch generic requests.
// Best approach: Add quotaRoutes specifically.
router.use('/employers', quotaRoutes);
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
router.use('/documents', documentRoutes);
router.use('/quota', quotaRoutes); // Assuming quota routes might be separate or handled in employers
router.use('/tax', taxRoutes);
router.use('/tax-config', taxConfigRoutes);
router.use('/search', searchRoutes);
router.use('/compliance', complianceRoutes);
router.use('/leads', leadsRoutes);

export default router;
