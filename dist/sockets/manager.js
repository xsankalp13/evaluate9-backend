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
exports.setupSocketManager = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const exam_handler_1 = require("./handlers/exam.handler");
const proctor_handler_1 = require("./handlers/proctor.handler"); // <--- Import
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const setupSocketManager = (io) => {
    // ... (Keep Auth Middleware same as before) ...
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        // ... existing auth logic ...
        // (Ensure you are attaching socket.data.sessionId and socket.data.testId)
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error("Authentication error: Token required"));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.data.candidateId = decoded.candidateId;
            socket.data.sessionId = decoded.sessionId;
            const session = yield db_1.db.examSession.findUnique({
                where: { id: decoded.sessionId },
                select: { testId: true }
            });
            if (session) {
                socket.data.testId = session.testId;
                next();
            }
            else {
                next(new Error("Session invalid"));
            }
        }
        catch (err) {
            next(new Error("Authentication error: Invalid Token"));
        }
    }));
    io.on('connection', (socket) => {
        console.log(`👨‍🎓 Candidate connected: ${socket.data.candidateId}`);
        const roomId = `session:${socket.data.sessionId}`;
        socket.join(roomId);
        socket.emit('system', { message: 'Connected to Exam Server' });
        // Register Handlers
        (0, exam_handler_1.ExamHandler)(socket); // Handles Chat/Questions
        (0, proctor_handler_1.ProctorHandler)(socket); // <--- Handles Anti-Cheat
        socket.on('disconnect', () => {
            console.log(`Candidate disconnected`);
        });
    });
};
exports.setupSocketManager = setupSocketManager;
