import { contractsRouter } from './contracts';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
// Import specific route modules here
import dashboardRoutes from './dashboard';
import workerRoutes from './workers';
import authRoutes from './auth';
import recruitmentRoutes from './recruitment';
import employerRoutes from './employers';
import commentRoutes from './comments';
import documentRoutes from './documents';
import deploymentRoutes from './deployments';
import permitRoutes from './permits';
import templatesRoutes from './templates';

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
import utilsRoutes from './utils';
import interviewsRouter from './interviews';
import hospitalRoutes from './hospitals';
import immigrationRouter from './immigration';
import industryRecognitionRoutes from './industryRecognitions';
import recruitmentProofRoutes from './recruitmentProofs';
import workerEventRoutes from './workerEvents';
import workerDocumentRoutes from './workerDocuments';

const router = Router();

router.use('/contracts', contractsRouter);

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
// Quota routes must come before general employer routes if they share the /employers prefix
router.use('/employers', quotaRoutes); // Handles /:id/labor-counts etc.
router.use('/employers', employerRoutes);
router.use('/comments', commentRoutes);
router.use('/documents', documentRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/permits', permitRoutes);
router.use('/templates', templatesRoutes);
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
router.use('/utils', utilsRoutes);
router.use('/interviews', interviewsRouter);
router.use('/hospitals', hospitalRoutes);

router.use('/immigration', immigrationRouter);
router.use('/industry-recognitions', industryRecognitionRoutes);
router.use('/recruitment-proofs', recruitmentProofRoutes);
router.use('/worker-events', workerEventRoutes);
router.use('/worker-documents', workerDocumentRoutes);

export default router;
