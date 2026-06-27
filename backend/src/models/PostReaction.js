import { query } from '../config/database.js';

export const PostReaction = {
  async toggle(userId, postId, reactionType) {
    const existing = await query(
      `SELECT id FROM post_reactions
       WHERE user_id = $1 AND post_id = $2 AND reaction_type = $3`,
      [userId, postId, reactionType]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM post_reactions
         WHERE user_id = $1 AND post_id = $2 AND reaction_type = $3`,
        [userId, postId, reactionType]
      );
      return { action: 'removed' };
    }

    await query(
      `INSERT INTO post_reactions (user_id, post_id, reaction_type)
       VALUES ($1, $2, $3)`,
      [userId, postId, reactionType]
    );
    return { action: 'added' };
  },

  async getReactionsForPost(postId) {
    const result = await query(
      `SELECT reaction_type, COUNT(*) as count
       FROM post_reactions
       WHERE post_id = $1
       GROUP BY reaction_type`,
      [postId]
    );

    const reactions = { amen: 0, encouraged: 0, praying: 0, blessed: 0, total: 0 };
    for (const row of result.rows) {
      reactions[row.reaction_type] = parseInt(row.count, 10);
      reactions.total += parseInt(row.count, 10);
    }
    return reactions;
  },

  async getUserReactionsForPost(userId, postId) {
    const result = await query(
      `SELECT reaction_type FROM post_reactions
       WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return result.rows.map(r => r.reaction_type);
  },

  async getBulkReactions(postIds) {
    if (postIds.length === 0) return {};

    const result = await query(
      `SELECT post_id, reaction_type, COUNT(*) as count
       FROM post_reactions
       WHERE post_id = ANY($1)
       GROUP BY post_id, reaction_type`,
      [postIds]
    );

    const map = {};
    for (const row of result.rows) {
      if (!map[row.post_id]) {
        map[row.post_id] = { amen: 0, encouraged: 0, praying: 0, blessed: 0, total: 0 };
      }
      map[row.post_id][row.reaction_type] = parseInt(row.count, 10);
      map[row.post_id].total += parseInt(row.count, 10);
    }
    return map;
  },

  async getBulkUserReactions(userId, postIds) {
    if (postIds.length === 0) return {};

    const result = await query(
      `SELECT post_id, reaction_type FROM post_reactions
       WHERE user_id = $1 AND post_id = ANY($2)`,
      [userId, postIds]
    );

    const map = {};
    for (const row of result.rows) {
      if (!map[row.post_id]) map[row.post_id] = [];
      map[row.post_id].push(row.reaction_type);
    }
    return map;
  }
};

export default PostReaction;
