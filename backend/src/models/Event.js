import { query } from '../config/database.js';

export const Event = {
  async create({ title, date, time, location, image, description, pointsReward, price, totalCapacity, type, registrationFields, createdBy }) {
    const result = await query(
      `INSERT INTO events (title, date, time, location, image, description, points_reward, price, total_capacity, type, registration_fields, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, date, time, location, image, description, pointsReward || 0, price || 'FREE', totalCapacity || 100, type || 'live', JSON.stringify(registrationFields || []), createdBy]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await query(
      `SELECT e.*, 
              (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registered_count,
              (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.checked_in = true) as checked_in_count
       FROM events e
       ORDER BY e.created_at DESC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT e.*, 
              (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registered_count,
              (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.checked_in = true) as checked_in_count
       FROM events e
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async register(userId, eventId, registrationData = {}) {
    const result = await query(
      `INSERT INTO event_registrations (user_id, event_id, registration_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) DO NOTHING
       RETURNING *`,
      [userId, eventId, JSON.stringify(registrationData)]
    );
    return result.rows[0];
  },

  async unregister(userId, eventId) {
    const result = await query(
      `DELETE FROM event_registrations
       WHERE user_id = $1 AND event_id = $2
       RETURNING *`,
      [userId, eventId]
    );
    return result.rows[0];
  },

  async checkIn(userId, eventId) {
    const result = await query(
      `UPDATE event_registrations
       SET checked_in = true
       WHERE user_id = $1 AND event_id = $2
       RETURNING *`,
      [userId, eventId]
    );
    return result.rows[0];
  },

  async getUserRegistrations(userId) {
    const result = await query(
      `SELECT er.*, e.title, e.date, e.time, e.location, e.image, e.points_reward
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async isRegistered(userId, eventId) {
    const result = await query(
      `SELECT id FROM event_registrations
       WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );
    return result.rows.length > 0;
  },

  async update(id, updates) {
    const allowedFields = ['title', 'date', 'time', 'location', 'image', 'description', 'points_reward', 'price', 'total_capacity', 'type', 'registration_fields'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'registration_fields') {
          filteredUpdates[key] = JSON.stringify(value);
        } else {
          filteredUpdates[key] = value;
        }
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
      `UPDATE events SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};

export default Event;
