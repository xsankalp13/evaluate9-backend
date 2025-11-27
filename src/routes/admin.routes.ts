import { Router } from 'express';
import multer from 'multer'; 
import path from 'path'; // Import path module
import { authenticate } from '../middlewares/auth.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import * as TestController from '../controller/admin/test.controller';
import * as CandidateController from '../controller/admin/candidate.controller';

const router = Router();

// --- CONFIGURE MULTER STORAGE (Fixes Extension Issue) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to uploads folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique name + KEEP ORIGINAL EXTENSION
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // Extract .pdf, .docx, etc.
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });
// -------------------------------------------------------

// Debug Route
router.post('/debug-upload', upload.any(), (req, res) => res.json({ success: true, files: req.files }));

// Apply Authentication & Tenant Context
router.use(authenticate, requireTenant);

// --- Tests Management ---
// We use .any() to allow flexible key names (file, files, document)
router.post('/tests', upload.any(), TestController.createTest);

router.get('/tests', TestController.getTests);

// --- Candidate Management ---
router.post('/candidates', CandidateController.addCandidate);
router.post('/candidates/bulk', upload.single('file'), CandidateController.bulkUpload); 
router.get('/candidates/:testId', CandidateController.listCandidates);

export default router;