import { Router } from 'express';
import Announcement from '../models/Announcement.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { eventBus } from '../events/eventBus.js';

const router = Router();

// GET /api/v1/announcements - List active announcements (or all for leaders)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const status = req.user.role === 'leader' ? null : 'Active';
    const announcements = await Announcement.findAll(status);
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/v1/announcements/stats - Get announcement statistics (leader only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const stats = await Announcement.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get announcement stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/announcements/:id - Get single announcement
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    // Increment views
    await Announcement.incrementViews(req.params.id);
    
    res.json({ announcement });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// POST /api/v1/announcements - Create announcement (leader only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const { title, content, priority, targetAudience, coverImage, status } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const announcement = await Announcement.create({
      authorId: req.user.id,
      title,
      content,
      priority,
      targetAudience,
      coverImage,
      status
    });
    
    res.status(201).json({ message: 'Announcement created', announcement });
    eventBus.broadcast('announcement:created', { announcementId: announcement.id });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// PUT /api/v1/announcements/:id - Update announcement (leader only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const announcement = await Announcement.update(req.params.id, req.body);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement updated', announcement });
    eventBus.broadcast('announcement:updated', { announcementId: req.params.id });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// DELETE /api/v1/announcements/:id - Delete announcement (leader only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const announcement = await Announcement.delete(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted' });
    eventBus.broadcast('announcement:deleted', { announcementId: req.params.id });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
