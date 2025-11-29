import { Router } from 'express';
import multer from 'multer'; 
import path from 'path'; // Import path module
import fs from 'fs';
import { authenticate } from '../middlewares/auth.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import * as TestController from '../controller/admin/test.controller';
import * as CandidateController from '../controller/admin/candidate.controller';

const router = Router();

// --- CONFIGURE MULTER STORAGE (Fixes Extension Issue) ---
// --- CONFIGURE MULTER STORAGE ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // FIX: Use Absolute Path using process.cwd()
    // This resolves to "/app/uploads" in Docker or "/your-project/uploads" locally
    const uploadPath = path.join(process.cwd(), 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`Created upload directory at: ${uploadPath}`);
      } catch (err) {
        console.error(`Failed to create upload directory at ${uploadPath}:`, err);
      }
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
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
router.get('/candidates', CandidateController.getAllCandidates);
router.get('/candidates/:testId', CandidateController.listCandidates);
router.get('/session/:sessionId', CandidateController.getCandidateSession);

export default router;