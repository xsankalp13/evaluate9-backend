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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const db_1 = require("../config/db");
const rag_service_1 = require("./rag.service");
exports.TestService = {
    createTest(tenantId, title, description, botConfig, durationMin) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db_1.db.test.create({
                data: { title, description, botConfig, durationMin, tenantId }
            });
        });
    },
    getTests(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db_1.db.test.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
        });
    },
    // --- SIMPLE VERSION (No Retry Loop) ---
    generateAndSaveQuestionSets(testId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[TestService] Calling RAG to generate questions...`);
            // 1. Call RAG (We expect this to work immediately now)
            const ragResponse = yield rag_service_1.RagService.generateQuestions(testId, 60, 'medium', [], token);
            const allQuestions = ragResponse.questions;
            if (!allQuestions || allQuestions.length === 0) {
                throw new Error("RAG returned empty questions list");
            }
            // 2. Shuffle
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }
            // 3. Split
            const chunkSize = Math.ceil(allQuestions.length / 3);
            const questionSets = [
                { name: "Set A", questions: allQuestions.slice(0, chunkSize) },
                { name: "Set B", questions: allQuestions.slice(chunkSize, chunkSize * 2) },
                { name: "Set C", questions: allQuestions.slice(chunkSize * 2) }
            ];
            // 4. Save
            yield db_1.db.test.update({
                where: { id: testId },
                data: { questionSets }
            });
            console.log(`[TestService] Saved ${allQuestions.length} questions into 3 sets.`);
            return questionSets;
        });
    }
};
