import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { jwtConfig } from '../config/auth.js';
import { query } from '../config/database.js';
import { validateRegistration, validateLogin } from '../utils/validators.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  return { accessToken, refreshToken, expiresAt };
};

// Store refresh token
const storeRefreshToken = async (userId, token, expiresAt) => {
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
};

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, avatar, emergencyContact } = req.body;

    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'youth',
      avatar,
      emergencyContact
    });

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken, expiresAt);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        points: user.points,
        level: user.level
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken, expiresAt);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        points: user.points,
        level: user.level,
        streak: user.streak,
        checkIns: user.check_ins,
        checkInsTarget: user.check_ins_target,
        prayersShared: user.prayers_shared,
        postsCount: user.posts_count
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        emergencyContact: user.emergency_contact,
        points: user.points,
        level: user.level,
        streak: user.streak,
        checkIns: user.check_ins,
        checkInsTarget: user.check_ins_target,
        prayersShared: user.prayers_shared,
        postsCount: user.posts_count,
        bio: user.bio,
        themePreference: user.theme_preference,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// PUT /api/v1/auth/profile - Update own profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, bio, emergencyContact, themePreference } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    if (emergencyContact !== undefined) updates.emergency_contact = emergencyContact;
    if (themePreference !== undefined) updates.theme_preference = themePreference;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [req.user.id, ...Object.values(updates)];

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, avatar, emergency_contact, points, level, streak,
                 check_ins, check_ins_target, prayers_shared, posts_count, bio, theme_preference, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Find refresh token
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenData = result.rows[0];
    
    // Delete old refresh token
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    // Generate new tokens
    const tokens = generateTokens(tokenData.user_id);
    await storeRefreshToken(tokenData.user_id, tokens.refreshToken, tokens.expiresAt);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
