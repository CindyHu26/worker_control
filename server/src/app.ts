import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', // 前端網址
    credentials: true // 必須開啟，因為您前端用了 credentials: 'include'
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
