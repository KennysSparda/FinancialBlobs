// /api/models/financialEntityModel.js

const db = require('../utils/db')

const FinancialEntity = {
  getAll: () => {
    return db.query('SELECT * FROM financial_entities')
  },

  getById: (id) => {
    return db.query('SELECT * FROM financial_entities WHERE id = ?', [id])
  },

  create: (data) => {
    return db.query(
      'INSERT INTO financial_entities (name, description, month_ref) VALUES (?, ?, ?)',
      [data.name, data.description, data.month_ref || null]
    )
  },

  update: (id, data) => {
    return db.query(
      'UPDATE financial_entities SET name = ?, description = ?, month_ref = ? WHERE id = ?',
      [data.name, data.description, data.month_ref, id]
    )
  },

  delete: (id) => {
    return db.query('DELETE FROM financial_entities WHERE id = ?', [id])
  }
}

module.exports = FinancialEntity
