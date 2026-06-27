import { Router } from 'express';
import { query } from '../config/database.js';
import SundayAttendance from '../models/SundayAttendance.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['leader']));

// POST /api/v1/sunday-attendance/checkin - Check in a member for Sunday attendance
router.post('/checkin', async (req, res) => {
  try {
    const { userId, date, time } = req.body;

    if (!userId || !date || !time) {
      return res.status(400).json({ error: 'userId, date, and time are required' });
    }

    const user = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const record = await SundayAttendance.create(userId, date, time);
    res.json({ message: 'Sunday attendance recorded', record });
  } catch (error) {
    console.error('Sunday check-in error:', error);
    res.status(500).json({ error: 'Failed to record Sunday attendance' });
  }
});

// GET /api/v1/sunday-attendance - Get attendance for a specific date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const records = await SundayAttendance.findByDate(date);
    res.json({ records });
  } catch (error) {
    console.error('Get Sunday attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch Sunday attendance' });
  }
});

// GET /api/v1/sunday-attendance/history - Get all Sundays with attendance counts
router.get('/history', async (req, res) => {
  try {
    const history = await SundayAttendance.findHistory();
    res.json({ history });
  } catch (error) {
    console.error('Get Sunday attendance history error:', error);
    res.status(500).json({ error: 'Failed to fetch Sunday attendance history' });
  }
});

// DELETE /api/v1/sunday-attendance - Remove a member's Sunday attendance
router.delete('/', async (req, res) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    const record = await SundayAttendance.delete(userId, date);
    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Sunday attendance removed' });
  } catch (error) {
    console.error('Delete Sunday attendance error:', error);
    res.status(500).json({ error: 'Failed to remove Sunday attendance' });
  }
});

export default router;