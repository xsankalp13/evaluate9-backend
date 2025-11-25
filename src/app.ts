import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mainRoutes from './routes/index'; 

const app: Application = express();

// --- 1. Global Middlewares ---
// Security Headers
app.use(helmet()); 


// CORS (Allow Frontend)
app.use(cors({
    origin: process.env.CLIENT_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Logging
app.use(morgan('dev'));

// Body Parsing
app.use(express.json()); 

// --- 2. Routes ---
// Mount all API routes under /api/v1
app.use('/api/v1', mainRoutes);

// --- 3. Health Check ---
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        service: 'Evaluate9 Backend'
    });
});

// --- 4. 404 Handler ---
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

export default app;