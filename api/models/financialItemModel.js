const db = require('../utils/db')

module.exports = {
  getAll: () => {
    return db.query('SELECT * FROM financial_items')
  },

  getById: (id) => {
    return db.query('SELECT * FROM financial_items WHERE id = ?', [id])
  },

  getByEntityId: (entityId) => {
    return db.query('SELECT * FROM financial_items WHERE entity_id = ?', [entityId])
  },

  create: (data) => {
    return db.query(
      `INSERT INTO financial_items 
      (entity_id, description, type, value, recurring, installment_now, installment_max, month_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.entity_id,
        data.description,
        data.type,
        data.value,
        data.recurring,
        data.installment_now,
        data.installment_max,
        data.month_ref
      ]
    )
  },

  update: (id, data) => {
    return db.query(
      `UPDATE financial_items SET 
        description = ?, type = ?, value = ?, recurring = ?, 
        installment_now = ?, installment_max = ?, month_ref = ?
       WHERE id = ?`,
      [
        data.description,
        data.type,
        data.value,
        data.recurring,
        data.installment_now,
        data.installment_max,
        data.month_ref,
        id
      ]
    )
  },

  delete: (id) => {
    return db.query('DELETE FROM financial_items WHERE id = ?', [id])
  },

  deleteInstallmentGroup: (item) => {
    return db.query(
      `DELETE FROM financial_items 
      WHERE entity_id = ? 
        AND description = ? 
        AND installment_max = ?`,
      [item.entity_id, item.description, item.installment_max]
    )
  }

}
