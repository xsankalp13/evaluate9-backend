import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { ExamHandler } from './handlers/exam.handler';
import { ProctorHandler } from './handlers/proctor.handler'; // <--- Import

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const setupSocketManager = (io: Server) => {
    
    // ... (Keep Auth Middleware same as before) ...
    io.use(async (socket, next) => {
        // ... existing auth logic ...
        // (Ensure you are attaching socket.data.sessionId and socket.data.testId)
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error: Token required"));

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            socket.data.candidateId = decoded.candidateId;
            socket.data.sessionId = decoded.sessionId;
            
            const session = await db.examSession.findUnique({
                where: { id: decoded.sessionId },
                select: { testId: true }
            });

            if (session) {
                socket.data.testId = session.testId;
                next();
            } else {
                next(new Error("Session invalid"));
            }
        } catch (err) {
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`👨‍🎓 Candidate connected: ${socket.data.candidateId}`);
        const roomId = `session:${socket.data.sessionId}`;
        socket.join(roomId);

        socket.emit('system', { message: 'Connected to Exam Server' });

        // Register Handlers
        ExamHandler(socket);    // Handles Chat/Questions
        ProctorHandler(socket); // <--- Handles Anti-Cheat

        socket.on('disconnect', () => {
            console.log(`Candidate disconnected`);
        });
    });
};