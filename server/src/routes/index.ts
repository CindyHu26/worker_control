
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
import partnerAgencyContractRoutes from './partnerAgencyContracts';
import partnerAgencyRoutes from './partnerAgencies';

// import evaluationRoutes from './evaluation';
import usersRoutes from './users';

// import jobsRoutes from './jobs';
import healthRoutes from './health';
import dormitoryRoutes from './dormitories';
import settingsRoutes from './settings';
import notificationsRoutes from './notifications';
import exportsRoutes from './exports';
import industryJobTitlesRouter from './industryJobTitles';
import loanBankRoutes from './loanBanks';
import kanbanRoutes from './kanban';
import searchRoutes from './search';
import quotaRoutes from './quota';
import taxRoutes from './tax';

import complianceRoutes from './compliance';
import leadsRoutes from './leads';
import taxConfigRoutes from './taxConfig';
import utilsRoutes from './utils';
import hospitalRoutes from './hospitals';
// import immigrationRouter from './immigration'; // REMOVED - Model Missing
import industryRecognitionRoutes from './industryRecognitions';
import recruitmentProofRoutes from './recruitmentProofs';
import workerEventRoutes from './workerEvents';
import workerDocumentRoutes from './workerDocuments';
import referenceDataRoutes from './referenceData';
import relocationRoutes from './relocation';
import employerCategoryRoutes from './employerCategories';
// import contractTypeRoutes from './contractTypes'; // REMOVED - Uses ReferenceData now
import countryRoutes from './countries';
// import jobTypeRoutes from './jobTypes';
import industryRoutes from './industries';
import domesticAgencyRoutes from './domesticAgencies';
import employeeRoutes from './employees';
import bankRoutes from './banks';

import departmentRoutes from './departments';
import applicationCategoryRoutes from './applicationCategories';
import workTitleRoutes from './workTitles';

import addressRouter from './address';

const router = Router();

router.use('/address', addressRouter);
router.use('/utils', utilsRoutes);
router.use('/partner-agency-contracts', partnerAgencyContractRoutes);
router.use('/departments', departmentRoutes);

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
    res.json({ message: "TMS API v1" });
});

// All routes after this middleware require authentication
router.use(authenticateToken);

router.use('/dashboard', dashboardRoutes);
// router.use('/workers', evaluationRoutes);
router.use('/workers', workerRoutes);
router.use('/recruitment', recruitmentRoutes);
// Quota routes must come before general employer routes if they share the /employers prefix
// handler order swap
router.use('/employers', employerRoutes);
router.use('/employers', quotaRoutes); // Handles /:id/labor-counts etc.
router.use('/comments', commentRoutes);
router.use('/documents', documentRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/permits', permitRoutes);
router.use('/templates', templatesRoutes);
router.use('/users', usersRoutes);
router.use('/users', usersRoutes);
// router.use('/accounting', accountingRoutes); // Disabled: schema models missing
// router.use('/jobs', jobsRoutes);
router.use('/health-checks', healthRoutes);
router.use('/dormitories', dormitoryRoutes);
router.use('/settings', settingsRoutes);
// router.use('/batch', batchRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/exports', exportsRoutes);
router.use('/industry-job-titles', industryJobTitlesRouter);
router.use('/kanban', kanbanRoutes);
router.use('/documents', documentRoutes);
router.use('/quota', quotaRoutes); // Assuming quota routes might be separate or handled in employers
router.use('/tax', taxRoutes);
router.use('/tax-config', taxConfigRoutes);
router.use('/search', searchRoutes);
router.use('/compliance', complianceRoutes);
router.use('/leads', leadsRoutes);
// router.use('/utils', utilsRoutes); // Moved up
// router.use('/interviews', interviewsRouter);
router.use('/hospitals', hospitalRoutes);

// router.use('/immigration', immigrationRouter); // REMOVED
router.use('/industry-recognitions', industryRecognitionRoutes);
router.use('/recruitment-proofs', recruitmentProofRoutes);
router.use('/worker-events', workerEventRoutes);
router.use('/worker-documents', workerDocumentRoutes);
router.use('/reference', referenceDataRoutes);
router.use('/relocation', relocationRoutes);
router.use('/employer-categories', employerCategoryRoutes); // Legacy - keep for backward compatibility
router.use('/application-categories', applicationCategoryRoutes); // New endpoint
// router.use('/job-types', jobTypeRoutes); // Legacy - REMOVED (Model Missing)
router.use('/work-titles', workTitleRoutes); // New endpoint
router.use('/industries', industryRoutes);
router.use('/domestic-agencies', domesticAgencyRoutes);
router.use('/employees', employeeRoutes);
router.use('/banks', bankRoutes);
router.use('/partner-agencies', partnerAgencyRoutes);

router.use('/loan-banks', loanBankRoutes);
// router.use('/contract-types', contractTypeRoutes); // REMOVED - Uses ReferenceData now
router.use('/countries', countryRoutes);

import billingPlanRoutes from './billingPlans';
import candidateRoutes from './candidates';
import interviewRoutes from './interviews';

router.use('/candidates', candidateRoutes);
router.use('/billing-plans', billingPlanRoutes);
router.use('/api', interviewRoutes); // Mounted at /api for /api/job-orders and /api/interviews

// import overseasProgressRoutes from './overseas-progress'; // DISABLED
// router.use('/overseas-progress', overseasProgressRoutes); // DISABLED

import entryFilingRoutes from './entry-filings';
import medicalExceptionRoutes from './medical-exceptions';
import alertRoutes from './alerts';

router.use('/entry-filings', entryFilingRoutes);
router.use('/medical-exceptions', medicalExceptionRoutes);
router.use('/alerts', alertRoutes);

import entryDocumentsRoutes from './entryDocuments';
router.use('/entry-documents', entryDocumentsRoutes);

// Phase 9: Enhanced Accounting Module
import billingItemDefinitionRoutes from './billingItemDefinitions';
import receivableRoutes from './receivables';

router.use('/billing-item-definitions', billingItemDefinitionRoutes);
router.use('/receivables', receivableRoutes);

import invoiceRoutes from './invoices';
router.use('/invoices', invoiceRoutes);

import runawayRoutes from './runaway';
router.use('/runaways', runawayRoutes);

// Schema-Driven UI Routes
import schemaRoutes from './schemas';
router.use('/schemas', schemaRoutes);

// Universal Entity Architecture - Generic Data API
import dataRoutes from './data';
router.use('/data', dataRoutes);

export default router;
