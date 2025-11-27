"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const manager_1 = require("./sockets/manager");
// Load env vars
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
const httpServer = http_1.default.createServer(app_1.default);
// 2. Initialize Socket.io with updated CORS
const io = new socket_io_1.Server(httpServer, {
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
(0, manager_1.setupSocketManager)(io);
httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});
