import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

// GET /api/health
router.get('/', async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;

  try {
    await query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error.message;
  }

  // Always return 200 so Railway's healthcheck passes.
  // Database status is reported in the response body for observability.
  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    ...(dbError && { databaseError: dbError })
  });
});

export default router;
