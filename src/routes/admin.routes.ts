import { Router } from 'express';
import multer from 'multer'; 
import path from 'path';
import fs from 'fs'; // <--- Import fs
import { authenticate } from '../middlewares/auth.middleware';
import { requireTenant } from '../middlewares/tenant.middleware';
import * as TestController from '../controller/admin/test.controller';
import * as CandidateController from '../controller/admin/candidate.controller';

const router = Router();

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
// --------------------------------

// Debug Route
router.post('/debug-upload', upload.any(), (req, res) => res.json({ success: true, files: req.files }));

router.use(authenticate, requireTenant);

// Tests
router.post('/tests', upload.any(), TestController.createTest);
router.get('/tests', TestController.getTests);

// Candidates
router.post('/candidates', CandidateController.addCandidate);
router.post('/candidates/bulk', upload.single('file'), CandidateController.bulkUpload); 
router.get('/candidates/:testId', CandidateController.listCandidates);

export default router;