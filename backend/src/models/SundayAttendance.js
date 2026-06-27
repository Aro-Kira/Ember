import { query } from '../config/database.js';

export const SundayAttendance = {
  async create(userId, date, time) {
    const result = await query(
      `INSERT INTO sunday_attendance (user_id, date, time)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) DO UPDATE SET time = $3, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, date, time]
    );
    return result.rows[0];
  },

  async findByDate(date) {
    const result = await query(
      `SELECT sa.id, sa.user_id as "userId", sa.date, sa.time, sa.created_at as "createdAt",
              u.name, u.avatar, u.level,
              CASE 
                WHEN u.level <= 5 THEN 'Ignition'
                WHEN u.level <= 10 THEN 'Blaze'
                ELSE 'Inferno'
              END as "levelName",
              '#RG-' || UPPER(SUBSTRING(u.id::text FROM 1 FOR 4)) as "rgId"
       FROM sunday_attendance sa
       JOIN users u ON sa.user_id = u.id
       WHERE sa.date = $1
       ORDER BY sa.time ASC`,
      [date]
    );
    return result.rows;
  },

  async findHistory() {
    const result = await query(
      `SELECT sa.date, COUNT(*) as attendee_count
       FROM sunday_attendance sa
       GROUP BY sa.date
       ORDER BY sa.date DESC`
    );
    return result.rows;
  },

  async findByUser(userId) {
    const result = await query(
      `SELECT * FROM sunday_attendance
       WHERE user_id = $1
       ORDER BY date DESC`,
      [userId]
    );
    return result.rows;
  },

  async delete(userId, date) {
    const result = await query(
      `DELETE FROM sunday_attendance
       WHERE user_id = $1 AND date = $2
       RETURNING *`,
      [userId, date]
    );
    return result.rows[0];
  }
};

export default SundayAttendance;