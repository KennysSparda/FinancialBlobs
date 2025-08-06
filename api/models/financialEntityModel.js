// /api/models/financialEntityModel.js

const db = require('../utils/db')

module.exports = {
  getAll: () => {
    return db.query('SELECT * FROM financial_entities')
  },

  getById: (id) => {
    return db.query('SELECT * FROM financial_entities WHERE id = ?', [id])
  },

  create: (data) => {
    return db.query(
      'INSERT INTO financial_entities (name, description) VALUES (?, ?)',
      [data.name, data.description]
    )
  },

  update: (id, data) => {
    return db.query(
      'UPDATE financial_entities SET name = ?, description = ? WHERE id = ?',
      [data.name, data.description, id]
    )
  },

  delete: (id) => {
    return db.query('DELETE FROM financial_entities WHERE id = ?', [id])
  }
}
