import { Router } from 'express';
import { query } from '../config/database.js';
import Post from '../models/Post.js';
import Prayer from '../models/Prayer.js';
import Announcement from '../models/Announcement.js';
import Event from '../models/Event.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { eventBus } from '../events/eventBus.js';

const router = Router();

// All leader routes require authentication and leader role
router.use(authenticateToken);
router.use(requireRole(['leader']));

// GET /api/v1/leader/members - Get all youth members
router.get('/members', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, role, avatar, points, level, streak, check_ins, 
              prayers_shared, posts_count, created_at
       FROM users
       WHERE role = 'youth'
       ORDER BY created_at DESC`
    );
    
    // Map level numbers to tier names
    const members = result.rows.map(member => ({
      ...member,
      levelName: member.level <= 5 ? 'Ignition' : member.level <= 10 ? 'Blaze' : 'Inferno',
      status: 'Active',
      joinedDate: new Date(member.created_at).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      })
    }));
    
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/v1/leader/members/:id - Get single member
router.get('/members/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, role, avatar, emergency_contact, points, level, streak, 
              check_ins, check_ins_target, prayers_shared, posts_count, bio, created_at
       FROM users
       WHERE id = $1 AND role = 'youth'`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const member = result.rows[0];
    member.levelName = member.level <= 5 ? 'Ignition' : member.level <= 10 ? 'Blaze' : 'Inferno';
    
    res.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// GET /api/v1/leader/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const memberResult = await query(
      `SELECT COUNT(*) as total_members,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
       FROM users WHERE role = 'youth'`
    );
    
    const postStats = await Post.getStats();
    const prayerStats = await Prayer.getStats();
    const announcementStats = await Announcement.getStats();
    
    const eventResult = await query(
      `SELECT COUNT(*) as total_events,
              (SELECT COUNT(*) FROM event_registrations) as total_registrations
       FROM events`
    );
    
    res.json({
      stats: {
        members: {
          total: parseInt(memberResult.rows[0].total_members),
          newThisMonth: parseInt(memberResult.rows[0].new_this_month)
        },
        posts: postStats,
        prayers: prayerStats,
        announcements: announcementStats,
        events: {
          total: parseInt(eventResult.rows[0].total_events),
          totalRegistrations: parseInt(eventResult.rows[0].total_registrations)
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST /api/v1/leader/posts/:id/approve - Approve a post
router.post('/posts/:id/approve', async (req, res) => {
  try {
    const post = await Post.approve(req.params.id, req.user.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Post approved', post });
    eventBus.broadcast('post:approved', { postId: post.id });
  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({ error: 'Failed to approve post' });
  }
});

// POST /api/v1/leader/posts/:id/reject - Reject a post
router.post('/posts/:id/reject', async (req, res) => {
  try {
    const post = await Post.reject(req.params.id, req.user.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Post rejected', post });
    eventBus.broadcast('post:rejected', { postId: post.id });
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({ error: 'Failed to reject post' });
  }
});

// POST /api/v1/leader/members - Create a new member
router.post('/members', async (req, res) => {
  try {
    const { email, name, avatar, level, status, emergencyContact } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.default.hash('password123', 10);

    const levelNum = level === 'Ignition' ? 1 : level === 'Blaze' ? 6 : 11;

    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, avatar, emergency_contact, level, points)
       VALUES ($1, $2, $3, 'youth', $4, $5, $6, 100)
       RETURNING id, email, name, role, avatar, points, level, created_at`,
      [email, passwordHash, name, avatar || null, emergencyContact || null, levelNum]
    );

    res.status(201).json({ message: 'Member created', member: result.rows[0] });
    eventBus.broadcast('member:created', { memberId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// PUT /api/v1/leader/members/:id - Update member details
router.put('/members/:id', async (req, res) => {
  try {
    const { name, email, avatar, level, status } = req.body;

    const allowedFields = {};
    if (name) allowedFields.name = name;
    if (email) allowedFields.email = email;
    if (avatar) allowedFields.avatar = avatar;
    if (level) {
      allowedFields.level = level === 'Ignition' ? 1 : level === 'Blaze' ? 6 : 11;
    }

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(allowedFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [req.params.id, ...Object.values(allowedFields)];

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'youth'
       RETURNING id, email, name, role, avatar, points, level, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member updated', member: result.rows[0] });
    eventBus.broadcast('member:updated', { memberId: req.params.id });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE /api/v1/leader/members/:id - Remove a youth member
router.delete('/members/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id',
      [req.params.id, 'youth']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member removed' });
    eventBus.broadcast('member:deleted', { memberId: req.params.id });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// GET /api/v1/leader/activity - Get recent activity log
router.get('/activity', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await query(
      `SELECT 'registration' as type, u.id::text, u.name, u.avatar, u.created_at as timestamp,
              'New Registration' as status
       FROM users u WHERE u.role = 'youth'
       UNION ALL
       SELECT 'post' as type, p.id::text, u.name, u.avatar, p.created_at as timestamp,
              CONCAT(p.status, ' ', p.type) as status
       FROM posts p JOIN users u ON p.author_id = u.id
       UNION ALL
       SELECT 'prayer' as type, pr.id::text, u.name, u.avatar, pr.created_at as timestamp,
              CONCAT(pr.stage, ' prayer') as status
       FROM prayers pr JOIN users u ON pr.author_id = u.id
       UNION ALL
       SELECT 'event_reg' as type, er.id::text, u.name, u.avatar, er.registered_at as timestamp,
              'Event Registration' as status
       FROM event_registrations er JOIN users u ON er.user_id = u.id
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ activity: result.rows });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// POST /api/v1/leader/events/:id/checkin-member - Check in a specific member to an event
router.post('/events/:id/checkin-member', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const event = await query('SELECT id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existing = await query(
      'SELECT id FROM event_registrations WHERE user_id = $1 AND event_id = $2',
      [userId, req.params.id]
    );

    if (existing.rows.length === 0) {
      await query(
        'INSERT INTO event_registrations (user_id, event_id, checked_in) VALUES ($1, $2, true)',
        [userId, req.params.id]
      );
    } else {
      await query(
        'UPDATE event_registrations SET checked_in = true WHERE user_id = $1 AND event_id = $2',
        [userId, req.params.id]
      );
    }

    res.json({ message: 'Member checked in successfully' });
    eventBus.broadcast('event:checked-in', { eventId: req.params.id, userId });
  } catch (error) {
    console.error('Check in member error:', error);
    res.status(500).json({ error: 'Failed to check in member' });
  }
});

// POST /api/v1/leader/announcements/:id/publish - Change announcement status to Active
router.post('/announcements/:id/publish', async (req, res) => {
  try {
    const result = await query(
      `UPDATE announcements SET status = 'Active', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement published', announcement: result.rows[0] });
    eventBus.broadcast('announcement:published', { announcementId: req.params.id });
  } catch (error) {
    console.error('Publish announcement error:', error);
    res.status(500).json({ error: 'Failed to publish announcement' });
  }
});

// POST /api/v1/leader/prayers/:id/stage - Update prayer stage
router.put('/prayers/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    
    if (!['new', 'active', 'archived'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    const prayer = await Prayer.updateStage(req.params.id, stage);
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    res.json({ message: 'Stage updated', prayer });
    eventBus.broadcast('prayer:stage-changed', { prayerId: req.params.id, stage });
  } catch (error) {
    console.error('Update prayer stage error:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

export default router;
