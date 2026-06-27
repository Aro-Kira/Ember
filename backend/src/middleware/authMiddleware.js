import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/auth.js';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    let user;
    try {
      user = await User.findById(decoded.userId);
    } catch (dbError) {
      console.error('Database error during auth:', dbError);
      return res.status(500).json({ error: 'Server error during authentication' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Token invalid, continue without user
  }
  
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export default authenticateToken;
