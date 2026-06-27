import { query } from '../config/database.js';

export const Announcement = {
  async create({ authorId, title, content, priority, targetAudience, coverImage, status }) {
    const result = await query(
      `INSERT INTO announcements (author_id, title, content, priority, target_audience, cover_image, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [authorId, title, content, priority || 'Normal', targetAudience || 'All Youth', coverImage, status || 'Active']
    );
    return result.rows[0];
  },

  async findAll(status = null) {
    let sql = `
      SELECT a.*, u.name as author_name, u.avatar as author_avatar
      FROM announcements a
      JOIN users u ON a.author_id = u.id
    `;
    const params = [];
    
    if (status) {
      sql += ' WHERE a.status = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY a.created_at DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT a.*, u.name as author_name, u.avatar as author_avatar
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async incrementViews(id) {
    const result = await query(
      `UPDATE announcements
       SET views = views + 1
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async update(id, updates) {
    const allowedFields = ['title', 'content', 'priority', 'target_audience', 'cover_image', 'status'];
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
      `UPDATE announcements SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM announcements WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async getStats() {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'Active') as active,
         COUNT(*) FILTER (WHERE status = 'Draft') as drafts,
         COUNT(*) FILTER (WHERE status = 'Archive') as archived,
         SUM(views) as total_views
       FROM announcements`
    );
    return result.rows[0];
  }
};

export default Announcement;
