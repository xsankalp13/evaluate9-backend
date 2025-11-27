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
exports.ProctorHandler = void 0;
const db_1 = require("../../config/db");
const MAX_VIOLATIONS = 3;
const ProctorHandler = (socket) => {
    const sessionId = socket.data.sessionId;
    socket.on('report_violation', (data) => __awaiter(void 0, void 0, void 0, function* () {
        // DEBUG LOG 1: Did we receive the event?
        console.log(`[DEBUG] Received Violation Event from ${socket.id}`, data);
        try {
            if (!sessionId) {
                console.error('[DEBUG] No Session ID found in socket');
                return;
            }
            // 1. Fetch Session
            const session = yield db_1.db.examSession.findUnique({
                where: { id: sessionId },
                select: { violations: true, status: true }
            });
            if (!session) {
                console.error('[DEBUG] Session not found in DB');
                return;
            }
            // DEBUG LOG 2: Check current status
            console.log(`[DEBUG] Current Status: ${session.status}, Violations:`, session.violations);
            if (session.status === 'COMPLETED' || session.status === 'TERMINATED') {
                console.log('[DEBUG] Ignored because session is already over');
                return;
            }
            // 2. Append Violation
            // Ensure we cast strictly to array, handling null case
            const currentViolations = Array.isArray(session.violations) ? session.violations : [];
            const newViolation = {
                type: data.type || 'UNKNOWN',
                timestamp: new Date().toISOString()
            };
            const updatedViolations = [...currentViolations, newViolation];
            const violationCount = updatedViolations.length;
            // 3. Update DB
            yield db_1.db.examSession.update({
                where: { id: sessionId },
                data: { violations: updatedViolations }
            });
            console.log(`[DEBUG] DB Updated. Count: ${violationCount}`);
            // 4. Trigger Consequences
            if (violationCount < MAX_VIOLATIONS) {
                console.log('[DEBUG] Emitting Warning');
                socket.emit('proctor_warning', {
                    message: `Warning: ${data.type} detected. Attempts left: ${MAX_VIOLATIONS - violationCount}`,
                    count: violationCount,
                    max: MAX_VIOLATIONS
                });
            }
            else {
                console.log('[DEBUG] Terminating Exam');
                yield db_1.db.examSession.update({
                    where: { id: sessionId },
                    data: { status: 'TERMINATED', endTime: new Date() }
                });
                socket.emit('exam_terminated', {
                    reason: 'Maximum proctoring violations reached.'
                });
                socket.disconnect(true);
            }
        }
        catch (error) {
            console.error('[Proctor] CRITICAL ERROR:', error);
        }
    }));
};
exports.ProctorHandler = ProctorHandler;
