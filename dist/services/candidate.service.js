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
exports.CandidateService = void 0;
const db_1 = require("../config/db");
exports.CandidateService = {
    // Add a candidate and assign them to a test immediately
    addCandidateToTest(tenantId, testId, email, name) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Check if Test belongs to Tenant (Security)
            const test = yield db_1.db.test.findFirst({
                where: { id: testId, tenantId }
            });
            if (!test)
                throw new Error('Test not found or access denied');
            // 2. Find or Create Candidate (Upsert)
            // We use "upsert" so we don't duplicate candidates with the same email in the same tenant
            const candidate = yield db_1.db.candidate.upsert({
                where: {
                    email_tenantId: { email, tenantId } // Unique constraint we defined in schema
                },
                update: { name }, // Update name if they exist
                create: {
                    email,
                    name,
                    tenantId
                }
            });
            // 3. Create the Exam Session (The actual "Ticket" to take the test)
            // Check if session already exists to prevent duplicate invites for same test
            const existingSession = yield db_1.db.examSession.findFirst({
                where: { testId, candidateId: candidate.id }
            });
            if (existingSession) {
                return { candidate, session: existingSession, isNew: false };
            }
            const session = yield db_1.db.examSession.create({
                data: {
                    testId,
                    candidateId: candidate.id,
                    status: 'SCHEDULED'
                }
            });
            return { candidate, session, isNew: true };
        });
    },
    // Get all candidates for a specific test (for the Admin Dashboard list)
    getCandidatesByTest(tenantId, testId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db_1.db.examSession.findMany({
                where: {
                    testId,
                    test: { tenantId } // Security check
                },
                include: {
                    candidate: true // Join candidate details
                }
            });
        });
    }
};
