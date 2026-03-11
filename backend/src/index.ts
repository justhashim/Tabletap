import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { testConnection } from './config/database.js';
import { authRouter } from './routes/auth.js';
import { menuRouter } from './routes/menu.js';
import { ordersRouter } from './routes/orders.js';
import { tablesRouter } from './routes/tables.js';
import { restaurantsRouter } from './routes/restaurants.js';
import { analyticsRouter } from './routes/analytics.js';
import { setupSocketHandlers } from './socket/orderSocket.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// ─── CORS origins ─────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    process.env.ADMIN_URL ?? 'http://localhost:3001',
    process.env.KITCHEN_URL ?? 'http://localhost:3002',
];

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});
setupSocketHandlers(io);

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Global rate limit
app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '200'),
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Share io instance with controllers via app.set
app.set('io', io);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'tabletap-api', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/analytics', analyticsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '4000', 10);

httpServer.listen(PORT, async () => {
    console.log(`\n🚀  TableTap API  →  http://localhost:${PORT}`);
    console.log(`🔌  WebSocket     →  ws://localhost:${PORT}\n`);
    await testConnection();
});

export { io };
