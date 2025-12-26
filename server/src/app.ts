import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import requestLoggerMiddleware from './middleware/requestLogger';
import logger from './utils/logger';

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // Serve uploaded files locally (legacy/backup)

// HTTP Request Logging (before routes)
app.use(requestLoggerMiddleware);

// API Routes
app.use('/api', routes);


// 404 Handler (Must be AFTER all routes)
app.use(notFoundHandler);

// Global Error Handler (Must be LAST)
app.use(errorHandler);

export default app;
