"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path")); // Import path module
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const TestController = __importStar(require("../controller/admin/test.controller"));
const CandidateController = __importStar(require("../controller/admin/candidate.controller"));
const router = (0, express_1.Router)();
// --- CONFIGURE MULTER STORAGE (Fixes Extension Issue) ---
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Save to uploads folder
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique name + KEEP ORIGINAL EXTENSION
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname); // Extract .pdf, .docx, etc.
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
// -------------------------------------------------------
// Debug Route
router.post('/debug-upload', upload.any(), (req, res) => res.json({ success: true, files: req.files }));
// Apply Authentication & Tenant Context
router.use(auth_middleware_1.authenticate, tenant_middleware_1.requireTenant);
// --- Tests Management ---
// We use .any() to allow flexible key names (file, files, document)
router.post('/tests', upload.any(), TestController.createTest);
router.get('/tests', TestController.getTests);
// --- Candidate Management ---
router.post('/candidates', CandidateController.addCandidate);
router.post('/candidates/bulk', upload.single('file'), CandidateController.bulkUpload);
router.get('/candidates/:testId', CandidateController.listCandidates);
exports.default = router;
