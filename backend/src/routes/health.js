import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

// GET /api/health
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected'
    });
  }
});

export default router;
