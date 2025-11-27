"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express")); // <--- Import
const swagger_1 = require("./config/swagger");
const index_1 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
// --- 1. Global Middlewares ---
// Security Headers
app.use((0, helmet_1.default)());
// CORS (Allow Frontend)
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
// Logging
app.use((0, morgan_1.default)('dev'));
// Body Parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- 2. Routes ---
// Mount all API routes under /api/v1
app.use('/api/v1', index_1.default);
// Accessible at http://localhost:4000/api-docs
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// --- 3. Health Check ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'Evaluate9 Backend'
    });
});
// --- 4. 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
exports.default = app;
