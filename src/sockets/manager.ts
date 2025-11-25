import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const setupSocketManager = (io: Server) => {
    
    // 1. Auth Middleware for Socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            
            // Attach data to socket session
            socket.data.candidateId = decoded.candidateId;
            socket.data.sessionId = decoded.sessionId;
            
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    // 2. Connection Handler
    io.on('connection', (socket: Socket) => {
        console.log(`👨‍🎓 Candidate connected: ${socket.data.candidateId}`);

        // Automatically join the room for their specific session
        const roomId = `session:${socket.data.sessionId}`;
        socket.join(roomId);

        // Notify client they are connected
        socket.emit('system', { message: 'Connected to Exam Server' });

        // Handle Chat Message
        socket.on('send_message', (data) => {
            console.log(`[${socket.data.candidateId}] says:`, data.message);
            // TODO: Integrate AI Service here in next step
        });

        socket.on('disconnect', () => {
            console.log(`Candidate disconnected: ${socket.data.candidateId}`);
        });
    });
};