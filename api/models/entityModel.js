// /api/models/entityModel.js
const db = require('../utils/db')

module.exports = {
  getAllByUserId: (userId) => {
    return db.query(
      'SELECT id, name, description, status, paid_at FROM financial_entities WHERE user_id = ? ORDER BY id DESC',
      [userId]
    )
  },

  getOwnedById: (id, userId) => {
    return db.query(
      'SELECT id, name, description, status, paid_at FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  },

  createForUser: (userId, data) => {
    return db.query(
      'INSERT INTO financial_entities (user_id, name, description) VALUES (?, ?, ?)',
      [userId, data.name, data.description]
    )
  },

  updateOwned: (id, userId, data) => {
    return db.query(
      'UPDATE financial_entities SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [data.name ?? null, data.description ?? null, id, userId]
    )
  },

  deleteOwned: (id, userId) => {
    return db.query(
      'DELETE FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  },

  isOwnedByUser: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT id FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return rows.length > 0
  },

  markPaidOwned: (id, userId, paidAt = null) => {
    return db.query(
      `UPDATE financial_entities
       SET status = 'paga', paid_at = COALESCE(?, NOW())
       WHERE id = ? AND user_id = ?`,
      [paidAt, id, userId]
    )
  },

  reopenOwned: (id, userId) => {
    return db.query(
      `UPDATE financial_entities
       SET status = 'aberta', paid_at = NULL
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    )
  },

  cancelOwned: (id, userId) => {
    return db.query(
      `UPDATE financial_entities
       SET status = 'cancelada', paid_at = NULL
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    )
  },

  markAllItemsPaidOwned: (id, userId, paidAt = null) => {
    return db.query(
      `UPDATE financial_items i
         JOIN financial_entities e ON e.id = i.entity_id
       SET i.paid_at = COALESCE(i.paid_at, COALESCE(?, NOW()))
       WHERE e.id = ? AND e.user_id = ?`,
      [paidAt, id, userId]
    )
  },

  getProgressOwned: async (id, userId) => {
    const [rows] = await db.query(
      `SELECT *
         FROM v_entity_progress
        WHERE entity_id = ? AND user_id = ?`,
      [id, userId]
    )
    return rows[0] || null
  }
}
