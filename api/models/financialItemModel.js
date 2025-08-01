const db = require('../utils/db')

const FinancialItem = {
  getAll: () => {
    return db.query('SELECT * FROM financial_items')
  },

  getById: (id) => {
    return db.query('SELECT * FROM financial_items WHERE id = ?', [id])
  },

  create: (data) => {
    return db.query(
      `INSERT INTO financial_items 
      (entity_id, description, type, value, recurring, installment_now, installment_max)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.entity_id,
        data.description,
        data.type,
        data.value,
        data.recurring,
        data.installment_now,
        data.installment_max
      ]
    )
  },

  update: (id, data) => {
    return db.query(
      `UPDATE financial_items SET 
        description = ?, type = ?, value = ?, recurring = ?, 
        installment_now = ?, installment_max = ?
       WHERE id = ?`,
      [
        data.description,
        data.type,
        data.value,
        data.recurring,
        data.installment_now,
        data.installment_max,
        id
      ]
    )
  },

  delete: (id) => {
    return db.query('DELETE FROM financial_items WHERE id = ?', [id])
  }
}

module.exports = FinancialItem
