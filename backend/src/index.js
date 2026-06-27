import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import eventRoutes from './routes/events.js';
import postRoutes from './routes/posts.js';
import prayerRoutes from './routes/prayers.js';
import announcementRoutes from './routes/announcements.js';
import leaderRoutes from './routes/leader.js';
import uploadRoutes from './routes/upload.js';
import sundayAttendanceRoutes from './routes/sunday-attendance.js';
import { eventBus } from './events/eventBus.js';
import { jwtConfig } from './config/auth.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration (must be before rate limiters so 429 responses get CORS headers)
const corsOrigins = process.env.CORS_ORIGINS === '*'
  ? '*'
  : process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3002', 'http://localhost:3003'];

app.use(cors({
  origin: corsOrigins,
  credentials: corsOrigins !== '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Exclude SSE stream from rate limiting
app.use('/api/', (req, res, next) => {
  if (req.path === '/v1/stream') return next();
  return limiter(req, res, next);
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

app.use('/api/v1/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint (before rate limiting)
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/prayers', prayerRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/leader', leaderRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/sunday-attendance', sundayAttendanceRoutes);

// SSE Stream endpoint
app.get('/api/v1/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: decoded.userId })}\n\n`);

    eventBus.addClient(decoded.userId, res);

    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      eventBus.removeClient(decoded.userId, res);
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Serve static frontends in production

const youthDist = fs.existsSync(path.join(__dirname, '../../Ember-Youth-Portal/dist'))
  ? path.join(__dirname, '../../Ember-Youth-Portal/dist')
  : path.join(__dirname, '../../frontend-youth');
const leaderDist = fs.existsSync(path.join(__dirname, '../../Ember-Youth-Leader-Portal/dist'))
  ? path.join(__dirname, '../../Ember-Youth-Leader-Portal/dist')
  : path.join(__dirname, '../../frontend-leader');

if (fs.existsSync(youthDist)) {
  app.use('/leader', express.static(leaderDist));
  app.get('/leader/*', (req, res) => res.sendFile(path.join(leaderDist, 'index.html')));
  app.use(express.static(youthDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(youthDist, 'index.html'));
  });
}

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`Risktaker Generation Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origins: ${Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins}`);
});

export default app;
