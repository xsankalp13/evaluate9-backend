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
exports.bulkUpload = exports.listCandidates = exports.addCandidate = void 0;
const candidate_service_1 = require("../../services/candidate.service");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const addCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.tenantId;
        const { testId, email, name } = req.body;
        if (!testId || !email || !name) {
            return res.status(400).json({ error: 'testId, email, and name are required' });
        }
        const result = yield candidate_service_1.CandidateService.addCandidateToTest(tenantId, testId, email, name);
        // Construct the "Magic Link" the user would click
        // In production, you would email this. For MVP, we return it in API.
        // URL format: http://frontend.com/exam/{candidate_access_key}
        const magicLink = `${process.env.CLIENT_URL}/exam/${result.candidate.accessKey}`;
        res.status(201).json({
            success: true,
            data: result,
            magicLink
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.addCandidate = addCandidate;
const listCandidates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.tenantId;
        const { testId } = req.params; // /candidates/:testId
        if (!testId)
            return res.status(400).json({ error: 'Test ID required' });
        const sessions = yield candidate_service_1.CandidateService.getCandidatesByTest(tenantId, testId);
        res.status(200).json({ success: true, data: sessions });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.listCandidates = listCandidates;
const bulkUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.tenantId;
        const { testId } = req.body;
        if (!req.file || !testId) {
            return res.status(400).json({ error: 'CSV file and testId are required' });
        }
        const results = [];
        const errors = [];
        // Parse CSV from the uploaded file path
        fs_1.default.createReadStream(req.file.path)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => results.push(data))
            .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            // Process each row
            const processed = [];
            for (const row of results) {
                // Expect CSV headers: email, name
                if (row.email && row.name) {
                    try {
                        const result = yield candidate_service_1.CandidateService.addCandidateToTest(tenantId, testId, row.email, row.name);
                        processed.push({ email: row.email, status: 'ADDED', magicLink: `${process.env.CLIENT_URL}/exam/${result.candidate.accessKey}` });
                    }
                    catch (err) {
                        errors.push({ email: row.email, error: err.message });
                    }
                }
            }
            // Cleanup: Delete the uploaded file to save space
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(200).json({ success: true, processed, errors });
        }));
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.bulkUpload = bulkUpload;
