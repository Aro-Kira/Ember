import { query } from '../config/database.js';

export const Prayer = {
  async create({ authorId, content, category, isAnonymous }) {
    const result = await query(
      `INSERT INTO prayers (author_id, content, category, is_anonymous)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [authorId, content, category || 'general', isAnonymous || false]
    );
    return result.rows[0];
  },

  async findAll(stage = null) {
    let sql = `
      SELECT p.*, 
             u.name as author_name, 
             u.avatar as author_avatar,
             CASE WHEN p.is_anonymous THEN 'Anonymous' ELSE u.name END as display_name,
             CASE WHEN p.is_anonymous THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' ELSE u.avatar END as display_avatar
      FROM prayers p
      JOIN users u ON p.author_id = u.id
    `;
    const params = [];
    
    if (stage) {
      sql += ' WHERE p.stage = $1';
      params.push(stage);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, 
             u.name as author_name, 
             u.avatar as author_avatar,
             CASE WHEN p.is_anonymous THEN 'Anonymous' ELSE u.name END as display_name,
             CASE WHEN p.is_anonymous THEN 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' ELSE u.avatar END as display_avatar
      FROM prayers p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByAuthor(authorId) {
    const result = await query(
      `SELECT * FROM prayers
       WHERE author_id = $1
       ORDER BY created_at DESC`,
      [authorId]
    );
    return result.rows;
  },

  async pray(userId, prayerId) {
    const result = await query(
      `INSERT INTO prayer_interactions (user_id, prayer_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, prayer_id) DO NOTHING
       RETURNING *`,
      [userId, prayerId]
    );
    
    if (result.rows[0]) {
      await query(
        `UPDATE prayers SET prayed_count = prayed_count + 1 WHERE id = $1`,
        [prayerId]
      );
    }
    
    return result.rows[0];
  },

  async hasPrayed(userId, prayerId) {
    const result = await query(
      `SELECT id FROM prayer_interactions
       WHERE user_id = $1 AND prayer_id = $2`,
      [userId, prayerId]
    );
    return result.rows.length > 0;
  },

  async toggleAnswered(id) {
    const result = await query(
      `UPDATE prayers
       SET is_answered = NOT is_answered
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async updateStage(id, stage) {
    const result = await query(
      `UPDATE prayers
       SET stage = $2
       WHERE id = $1
       RETURNING *`,
      [id, stage]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM prayers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async getStats() {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE stage = 'new') as new_count,
         COUNT(*) FILTER (WHERE stage = 'active') as active,
         COUNT(*) FILTER (WHERE stage = 'archived') as archived,
         COUNT(*) FILTER (WHERE is_answered = true) as answered,
         SUM(prayed_count) as total_prayers
       FROM prayers`
    );
    return result.rows[0];
  }
};

export default Prayer;
