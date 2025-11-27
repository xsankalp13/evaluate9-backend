"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const exam_routes_1 = __importDefault(require("./exam.routes"));
// Import sub-routers here later
// import authRoutes from './auth.routes';
// import adminRoutes from './admin.routes';
const router = (0, express_1.Router)();
// Auth routes
router.use('/auth', auth_routes_1.default);
// Admin Routes
router.use('/admin', admin_routes_1.default);
// 3. Exam Routes (Public but protected by Access Key) - /api/v1/exam/verify/:key
router.use('/exam', exam_routes_1.default);
// Test Route
router.get('/ping', (req, res) => {
    res.json({ message: 'Pong', tenant: req.tenantId || 'Unknown' });
});
// Mount sub-routers
// router.use('/auth', authRoutes);
// router.use('/admin', adminRoutes);
exports.default = router;
