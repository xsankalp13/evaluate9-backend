import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { Server } from 'socket.io';
import { setupSocketManager } from './sockets/manager';

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);

// 2. Initialize Socket.io with updated CORS
const io = new Server(httpServer, {
    cors: {
        // Allow both your frontend URL AND your local testing URL
        origin: [
            process.env.CLIENT_URL || "http://localhost:3000", 
            "http://127.0.0.1:5500", 
            "http://localhost:5500"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

setupSocketManager(io);

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});