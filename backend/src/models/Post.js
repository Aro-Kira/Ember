import { query } from '../config/database.js';

export const Post = {
  async create({ authorId, title, body, type }) {
    const result = await query(
      `INSERT INTO posts (author_id, title, body, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [authorId, title, body, type]
    );
    return result.rows[0];
  },

  async findAll(status = null) {
    let sql = `
      SELECT p.*, u.name as author_name, u.avatar as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;
    const params = [];
    
    if (status) {
      sql += ' WHERE p.status = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, u.name as author_name, u.avatar as author_avatar
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByAuthor(authorId) {
    const result = await query(
      `SELECT * FROM posts
       WHERE author_id = $1
       ORDER BY created_at DESC`,
      [authorId]
    );
    return result.rows;
  },

  async approve(id, reviewedBy) {
    const result = await query(
      `UPDATE posts
       SET status = 'approved', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reviewedBy]
    );
    return result.rows[0];
  },

  async reject(id, reviewedBy) {
    const result = await query(
      `UPDATE posts
       SET status = 'rejected', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reviewedBy]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async getStats() {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'approved') as approved,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
         COUNT(*) FILTER (WHERE type = 'devotional') as devotionals,
         COUNT(*) FILTER (WHERE type = 'testimony') as testimonies
       FROM posts`
    );
    return result.rows[0];
  }
};

export default Post;
