import { Router } from 'express';
import Post from '../models/Post.js';
import PostReaction from '../models/PostReaction.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { eventBus } from '../events/eventBus.js';

const router = Router();

// GET /api/v1/posts - List approved posts (or all for leaders) with reaction data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const status = req.user.role === 'leader' ? null : 'approved';
    const posts = await Post.findAll(status);

    const postIds = posts.map(p => p.id);
    const [bulkReactions, bulkUserReactions] = await Promise.all([
      PostReaction.getBulkReactions(postIds),
      PostReaction.getBulkUserReactions(req.user.id, postIds)
    ]);

    const enriched = posts.map(p => ({
      ...p,
      reactions: bulkReactions[p.id] || { amen: 0, encouraged: 0, praying: 0, blessed: 0, total: 0 },
      userReactions: bulkUserReactions[p.id] || []
    }));

    res.json({ posts: enriched });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/v1/posts/mine - Get current user's posts
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.findByAuthor(req.user.id);
    res.json({ posts });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});

// GET /api/v1/posts/pending - Get pending posts (leader only)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const posts = await Post.findAll('pending');
    res.json({ posts });
  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({ error: 'Failed to fetch pending posts' });
  }
});

// GET /api/v1/posts/stats - Get post statistics (leader only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
    const stats = await Post.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get post stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/v1/posts/:id - Get single post
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/v1/posts - Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, body, type } = req.body;
    
    if (!title || !body || !type) {
      return res.status(400).json({ error: 'Title, body, and type are required' });
    }
    
    if (!['devotional', 'testimony'].includes(type)) {
      return res.status(400).json({ error: 'Type must be devotional or testimony' });
    }
    
    const post = await Post.create({
      authorId: req.user.id,
      title,
      body,
      type
    });
    
    // Update user's post count and award points
    await User.updateStats(req.user.id, {
      posts_count: req.user.posts_count + 1,
      points: req.user.points + 25
    });
    
    res.status(201).json({ 
      message: 'Post submitted for review',
      post,
      pointsEarned: 25
    });

    eventBus.broadcast('post:created', { postId: post.id });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/v1/posts/:id/approve - Approve post (leader only)
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
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

// POST /api/v1/posts/:id/reject - Reject post (leader only)
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Leaders only' });
    }
    
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

// DELETE /api/v1/posts/:id - Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only author or leader can delete
    if (post.author_id !== req.user.id && req.user.role !== 'leader') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Post.delete(req.params.id);
    res.json({ message: 'Post deleted' });
    eventBus.broadcast('post:deleted', { postId: req.params.id });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/v1/posts/:id/react - Toggle a reaction on a post
router.post('/:id/react', authenticateToken, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const validTypes = ['amen', 'encouraged', 'praying', 'blessed'];

    if (!reactionType || !validTypes.includes(reactionType)) {
      return res.status(400).json({ error: 'reactionType must be amen, encouraged, praying, or blessed' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await PostReaction.toggle(req.user.id, req.params.id, reactionType);
    const reactions = await PostReaction.getReactionsForPost(req.params.id);
    const userReactions = await PostReaction.getUserReactionsForPost(req.user.id, req.params.id);

    res.json({ action: result.action, reactions, userReactions });
    eventBus.broadcast('post:reacted', { postId: req.params.id, reactions, userReactions });
  } catch (error) {
    console.error('Toggle reaction error:', error);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

// GET /api/v1/posts/:id/reactions - Get reaction counts and user reactions for a post
router.get('/:id/reactions', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reactions = await PostReaction.getReactionsForPost(req.params.id);
    const userReactions = await PostReaction.getUserReactionsForPost(req.user.id, req.params.id);

    res.json({ reactions, userReactions });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

export default router;
