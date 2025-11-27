"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTests = exports.createTest = void 0;
const test_service_1 = require("../../services/test.service");
const rag_service_1 = require("../../services/rag.service");
const fs_1 = __importDefault(require("fs"));
// Small helper to give the Vector DB a moment to settle after ingestion
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const createTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadedFiles = req.files || [];
    try {
        console.log("Creating Test... Files received:", uploadedFiles.length);
        const tenantId = req.tenantId;
        const { title, description, durationMin } = req.body;
        let { botConfig } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token)
            throw new Error("Authorization token missing");
        if (uploadedFiles.length === 0)
            return res.status(400).json({ error: 'Question Bank PDF is required.' });
        if (typeof botConfig === 'string') {
            try {
                botConfig = JSON.parse(botConfig);
            }
            catch (e) { }
        }
        // 1. Create Test in DB
        const test = yield test_service_1.TestService.createTest(tenantId, title || "Untitled Test", description, botConfig || {}, parseInt(durationMin) || 30);
        // 2. Start Ingestion (We AWAIT this, so it blocks until finished)
        const filePaths = uploadedFiles.map(f => f.path);
        console.log(`[Controller] Ingesting files for Test ${test.id}...`);
        // This line will wait the ~25 seconds for Python to finish
        yield rag_service_1.RagService.ingestKnowledgeBase(tenantId, test.id, botConfig, filePaths, token);
        console.log(`[Controller] Ingestion Complete. Generating Questions...`);
        // 3. Safety Delay (Optional but recommended)
        // Even if Python finishes, sometimes the Database needs 1s to be queryable.
        yield wait(2000);
        // 4. Generate Questions
        yield test_service_1.TestService.generateAndSaveQuestionSets(test.id, token);
        console.log(`[Controller] Done!`);
        // 5. Cleanup
        uploadedFiles.forEach(f => { if (fs_1.default.existsSync(f.path))
            fs_1.default.unlinkSync(f.path); });
        res.status(201).json({
            success: true,
            message: 'Test created and initialized successfully.',
            data: test
        });
    }
    catch (error) {
        uploadedFiles.forEach(f => { if (fs_1.default.existsSync(f.path))
            fs_1.default.unlinkSync(f.path); });
        console.error("Create Test Failed:", error.message);
        // Return 500 so frontend knows it failed
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.createTest = createTest;
const getTests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.tenantId;
        const tests = yield test_service_1.TestService.getTests(tenantId);
        res.status(200).json({ success: true, data: tests });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.getTests = getTests;
