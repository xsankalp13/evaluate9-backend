import { Router } from 'express';
import * as AccessController from '../controller/exam/access.controller';

const router = Router();

// Public route (Protected by the accessKey logic itself)
router.get('/verify/:accessKey', AccessController.verifyExamAccess);

export default router;