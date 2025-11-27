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
exports.ExamService = void 0;
const db_1 = require("../config/db");
const auth_1 = require("../utils/auth");
exports.ExamService = {
    // Verify the Candidate's Access Key
    verifyAccess(accessKey) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Find the Candidate by the unique key
            const candidate = yield db_1.db.candidate.findUnique({
                where: { accessKey },
                include: {
                    tenant: true // We need config (logo, name)
                }
            });
            if (!candidate)
                throw new Error('Invalid Access Key');
            // 2. Find the SCHEDULED session for this candidate
            // (Assuming 1 active test per candidate for MVP)
            const session = yield db_1.db.examSession.findFirst({
                where: {
                    candidateId: candidate.id,
                    status: { in: ['SCHEDULED', 'IN_PROGRESS'] } // Allow re-entry if crashed
                },
                include: {
                    test: true // We need Test Title, Duration, Bot Config
                }
            });
            if (!session)
                throw new Error('No active test found for this candidate');
            // 3. Generate a temporary "Exam Token" for the WebSocket
            // This is different from the Admin Token. It identifies the Candidate.
            const examToken = (0, auth_1.generateToken)({
                candidateId: candidate.id,
                sessionId: session.id,
                tenantId: candidate.tenantId,
                role: 'CANDIDATE'
            });
            return {
                candidate: { name: candidate.name, email: candidate.email },
                tenant: { name: candidate.tenant.name, config: candidate.tenant.config },
                test: { title: session.test.title, duration: session.test.durationMin },
                session: { id: session.id, status: session.status, startTime: session.startTime },
                token: examToken
            };
        });
    }
};
