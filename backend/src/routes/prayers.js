import { Router } from 'express';
import Prayer from '../models/Prayer.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { eventBus } from '../events/eventBus.js';

const router = Router();

// GET /api/v1/prayers - List prayers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const stage = req.query.stage || null;
    const prayers = await Prayer.findAll(stage);
    
    // Add hasPrayed status for current user
    const prayersWithStatus = await Promise.all(
      prayers.map(async (prayer) => {
        const hasPrayed = await Prayer.hasPrayed(req.user.id, prayer.id);
        return {
          ...prayer,
          hasPrayed,
          prayedCount: parseInt(prayer.prayed_count)
        };
      })
    );
    
    res.json({ prayers: prayersWithStatus });
  } catch (error) {
    console.error('Get prayers error:', error);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

// GET /api/v1/prayers/mine - Get current user's prayers
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const prayers = await Prayer.findByAuthor(req.user.id);
    res.json({ prayers });
  } catch (error) {
    console.error('Get my prayers error:', error);
    res.status(500).json({ error: 'Failed to fetch your prayers' });
  }
});

// GET /api/v1/prayers/stats - Get prayer statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Prayer.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get prayer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/prayers/:id - Get single prayer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    const hasPrayed = await Prayer.hasPrayed(req.user.id, prayer.id);
    
    res.json({
      prayer: {
        ...prayer,
        hasPrayed,
        prayedCount: parseInt(prayer.prayed_count)
      }
    });
  } catch (error) {
    console.error('Get prayer error:', error);
    res.status(500).json({ error: 'Failed to fetch prayer' });
  }
});

// POST /api/v1/prayers - Create prayer request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, category, isAnonymous } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const prayer = await Prayer.create({
      authorId: req.user.id,
      content,
      category,
      isAnonymous
    });
    
    // Update user's prayer count and award points
    await User.updateStats(req.user.id, {
      prayers_shared: req.user.prayers_shared + 1,
      points: req.user.points + 15
    });
    
    res.status(201).json({ 
      message: 'Prayer request submitted',
      prayer,
      pointsEarned: 15
    });
    eventBus.broadcast('prayer:created', { prayerId: prayer.id });
  } catch (error) {
    console.error('Create prayer error:', error);
    res.status(500).json({ error: 'Failed to create prayer' });
  }
});

// POST /api/v1/prayers/:id/pray - Pray for a request
router.post('/:id/pray', authenticateToken, async (req, res) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    const result = await Prayer.pray(req.user.id, req.params.id);
    
    if (result) {
      res.json({ message: 'Prayer recorded' });
      eventBus.broadcast('prayer:prayed', { prayerId: req.params.id });
    } else {
      res.json({ message: 'Already prayed for this request' });
    }
  } catch (error) {
    console.error('Pray error:', error);
    res.status(500).json({ error: 'Failed to record prayer' });
  }
});

// POST /api/v1/prayers/:id/answered - Toggle answered status
router.post('/:id/answered', authenticateToken, async (req, res) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    // Only author can mark as answered
    if (prayer.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the author can mark as answered' });
    }
    
    const updated = await Prayer.toggleAnswered(req.params.id);
    
    if (updated.is_answered) {
      // Award points for answered prayer
      await User.updateStats(req.user.id, {
        points: req.user.points + 20
      });
      res.json({ message: 'Marked as answered', prayer: updated, pointsEarned: 20 });
    } else {
      res.json({ message: 'Unmarked as answered', prayer: updated });
    }
    eventBus.broadcast('prayer:answered', { prayerId: req.params.id });
  } catch (error) {
    console.error('Toggle answered error:', error);
    res.status(500).json({ error: 'Failed to update prayer' });
  }
});

// PUT /api/v1/prayers/:id/stage - Update prayer stage (leader only)
router.put('/:id/stage', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
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
    console.error('Update stage error:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// DELETE /api/v1/prayers/:id - Delete prayer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    
    // Only author or leader can delete
    if (prayer.author_id !== req.user.id && req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Prayer.delete(req.params.id);
    res.json({ message: 'Prayer deleted' });
    eventBus.broadcast('prayer:deleted', { prayerId: req.params.id });
  } catch (error) {
    console.error('Delete prayer error:', error);
    res.status(500).json({ error: 'Failed to delete prayer' });
  }
});

export default router;
