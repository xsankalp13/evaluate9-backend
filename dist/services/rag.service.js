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
exports.RagService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';
exports.RagService = {
    ingestKnowledgeBase(tenantId, testId, botConfig, filePaths, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const formData = new form_data_1.default();
                formData.append('tenant_id', tenantId);
                formData.append('test_id', testId);
                formData.append('metadata', JSON.stringify(botConfig || {}));
                formData.append('documents_json', JSON.stringify([]));
                if (filePaths && filePaths.length > 0) {
                    for (const filePath of filePaths) {
                        if (fs_1.default.existsSync(filePath)) {
                            formData.append('files', fs_1.default.createReadStream(filePath));
                        }
                    }
                }
                const response = yield axios_1.default.post(`${RAG_API_URL}/ingest`, formData, {
                    headers: Object.assign(Object.assign({}, formData.getHeaders()), { 'Authorization': `Bearer ${token}` }),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                console.log(response.data);
                return response.data;
            }
            catch (error) {
                console.error('[RAG] Ingestion Failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error; // Re-throw original error
            }
        });
    },
    generateQuestions(testId_1) {
        return __awaiter(this, arguments, void 0, function* (testId, numQuestions = 5, difficulty = "medium", alreadyHas = [], token) {
            try {
                const response = yield axios_1.default.post(`${RAG_API_URL}/generate-questions`, {
                    test_id: testId,
                    num_questions: numQuestions,
                    difficulty: difficulty,
                    already_has: alreadyHas
                }, { headers: { 'Authorization': `Bearer ${token}` } });
                return response.data;
            }
            catch (error) {
                // IMPORTANT: Do NOT wrap this in a new Error(). 
                // We need the original Axios error to see the 404 status in the controller.
                throw error;
            }
        });
    },
    evaluateAnswer(testId, question, candidateAnswer, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post(`${RAG_API_URL}/retrieve`, {
                    question: question,
                    query: candidateAnswer,
                    filters: { test_id: testId },
                    top_k: 3
                }, { headers: { 'Authorization': `Bearer ${token}` } });
                return response.data;
            }
            catch (error) {
                console.error('[RAG] Evaluation Failed:', error.message);
                throw error;
            }
        });
    }
};
