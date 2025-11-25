import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import * as TestController from '../controller/admin/test.controller';
import * as CandidateController from '../controller/admin/candidate.controller'; 


const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply Auth & Tenant middleware to ALL routes in this file
router.use(authenticate, requireTenant);

// Test Management
router.post('/tests', TestController.createTest);
router.get('/tests', TestController.getTests);

// Candidates
router.post('/candidates', CandidateController.addCandidate); // Add single candidate
router.post('/candidates/bulk', upload.single('file'), CandidateController.bulkUpload); // Bulk Route
router.get('/candidates/:testId', CandidateController.listCandidates); // List candidates for a test


export default router;