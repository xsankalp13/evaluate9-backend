import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import examRoutes from './exam.routes';

// Import sub-routers here later
// import authRoutes from './auth.routes';
// import adminRoutes from './admin.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Admin Routes
router.use('/admin', adminRoutes);

// 3. Exam Routes (Public but protected by Access Key) - /api/v1/exam/verify/:key
router.use('/exam', examRoutes);

// Test Route
router.get('/ping', (req, res) => {
    res.json({ message: 'Pong', tenant: req.tenantId || 'Unknown' });
});

// Mount sub-routers
// router.use('/auth', authRoutes);
// router.use('/admin', adminRoutes);

export default router;