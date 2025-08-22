// /api/models/financialEntityModel.js
const db = require('../utils/db')

module.exports = {
  // lista entidades do usuário
  getAllByUserId: (userId) => {
    return db.query(
      'SELECT id, name, description FROM financial_entities WHERE user_id = ? ORDER BY id DESC',
      [userId]
    )
  },

  // pega uma entidade específica do usuário
  getOwnedById: (id, userId) => {
    return db.query(
      'SELECT id, name, description FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  },

  // cria entidade já vinculando user_id
  createForUser: (userId, data) => {
    return db.query(
      'INSERT INTO financial_entities (user_id, name, description) VALUES (?, ?, ?)',
      [userId, data.name, data.description]
    )
  },

  // atualiza somente se pertencer ao usuário
  updateOwned: (id, userId, data) => {
    return db.query(
      'UPDATE financial_entities SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [data.name ?? null, data.description ?? null, id, userId]
    )
  },

  // remove somente se pertencer ao usuário
  deleteOwned: (id, userId) => {
    return db.query(
      'DELETE FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  },

  // checagem booleana de posse
  isOwnedByUser: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT id FROM financial_entities WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return rows.length > 0
  }
}
