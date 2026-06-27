import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const User = {
  async create({ email, password, name, role = 'youth', avatar, emergencyContact }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, avatar, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, avatar, points, level, created_at`,
      [email, passwordHash, name, role, avatar, emergencyContact]
    );
    
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT id, email, name, role, avatar, emergency_contact, points, level, 
              streak, check_ins, check_ins_target, prayers_shared, posts_count, bio, theme_preference, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },

  async updateProfile(id, updates) {
    const allowedFields = ['name', 'avatar', 'bio', 'emergency_contact', 'theme_preference'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      return this.findById(id);
    }
    
    const setClause = Object.keys(filteredUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(filteredUpdates)];
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, avatar, points, level, created_at`,
      values
    );
    
    return result.rows[0];
  },

  async updateStats(id, stats) {
    const allowedFields = ['points', 'level', 'streak', 'check_ins', 'prayers_shared', 'posts_count'];
    const filteredStats = {};
    
    for (const [key, value] of Object.entries(stats)) {
      if (allowedFields.includes(key)) {
        filteredStats[key] = value;
      }
    }
    
    if (Object.keys(filteredStats).length === 0) {
      return this.findById(id);
    }
    
    const setClause = Object.keys(filteredStats)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(filteredStats)];
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, points, level, streak, check_ins, prayers_shared, posts_count`,
      values
    );
    
    return result.rows[0];
  }
};

export default User;
