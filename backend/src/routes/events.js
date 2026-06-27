import { Router } from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { eventBus } from '../events/eventBus.js';

const router = Router();

// GET /api/v1/events - List all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.findAll();
    
    // Add registration status for current user
    const eventsWithStatus = await Promise.all(
      events.map(async (event) => {
        const isRegistered = await Event.isRegistered(req.user.id, event.id);
        return {
          ...event,
          registered: isRegistered,
          registeredCount: parseInt(event.registered_count),
          checkedInCount: parseInt(event.checked_in_count)
        };
      })
    );
    
    res.json({ events: eventsWithStatus });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/v1/events/:id - Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const isRegistered = await Event.isRegistered(req.user.id, event.id);
    
    res.json({
      event: {
        ...event,
        registered: isRegistered,
        registeredCount: parseInt(event.registered_count),
        checkedInCount: parseInt(event.checked_in_count)
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/v1/events - Create event (leader only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const event = await Event.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({ message: 'Event created', event });
    eventBus.broadcast('event:created', { eventId: event.id });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /api/v1/events/:id/register - Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const existing = await Event.isRegistered(req.user.id, event.id);
    if (existing) {
      return res.status(409).json({ error: 'Already registered' });
    }
    
    const { registrationData } = req.body || {};
    await Event.register(req.user.id, event.id, registrationData || {});
    
    // Award points
    if (event.points_reward > 0) {
      await User.updateStats(req.user.id, {
        points: req.user.points + event.points_reward
      });
    }
    
    res.json({ message: 'Registered successfully', pointsEarned: event.points_reward });
    eventBus.broadcast('event:registered', { eventId: req.params.id });
  } catch (error) {
    console.error('Register event error:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// POST /api/v1/events/:id/unregister - Unregister from event
router.post('/:id/unregister', authenticateToken, async (req, res) => {
  try {
    const result = await Event.unregister(req.user.id, req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Unregistered successfully' });
    eventBus.broadcast('event:unregistered', { eventId: req.params.id });
  } catch (error) {
    console.error('Unregister event error:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

// POST /api/v1/events/:id/checkin - Check in to event
router.post('/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const result = await Event.checkIn(req.user.id, req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Checked in successfully' });
    eventBus.broadcast('event:checked-in', { eventId: req.params.id });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// GET /api/v1/events/user/mine - Get user's registrations
router.get('/user/mine', authenticateToken, async (req, res) => {
  try {
    const registrations = await Event.getUserRegistrations(req.user.id);
    res.json({ registrations });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
});

// PUT /api/v1/events/:id - Update event (leader only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const event = await Event.update(req.params.id, req.body);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event updated', event });
    eventBus.broadcast('event:updated', { eventId: req.params.id });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/v1/events/:id - Delete event (leader only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const event = await Event.delete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted' });
    eventBus.broadcast('event:deleted', { eventId: req.params.id });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
