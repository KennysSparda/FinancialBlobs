// /api/models/financialItemModel.js
const db = require('../utils/db')

module.exports = {
  // lista todos os itens do usuário via JOIN
  listAllByUserId: (userId) => {
    return db.query(
      `SELECT i.id, i.entity_id, i.description, i.type, i.value, i.recurring,
              i.installment_now, i.installment_max, i.month_ref
       FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE e.user_id = ?
       ORDER BY i.id DESC`,
      [userId]
    )
  },

  // pega item específico do usuário
  getOwnedById: (id, userId) => {
    return db.query(
      `SELECT i.id, i.entity_id, i.description, i.type, i.value, i.recurring,
              i.installment_now, i.installment_max, i.month_ref
       FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE i.id = ? AND e.user_id = ?`,
      [id, userId]
    )
  },

  // pega itens por entidade, garantindo que a entidade é do usuário
  getByEntityIdOwned: (entityId, userId) => {
    return db.query(
      `SELECT i.id, i.entity_id, i.description, i.type, i.value, i.recurring,
              i.installment_now, i.installment_max, i.month_ref
       FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE i.entity_id = ? AND e.user_id = ?
       ORDER BY i.id DESC`,
      [entityId, userId]
    )
  },

  // criação simples (ownership verificado fora)
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
        data.recurring ? 1 : 0,
        data.installment_now ?? 0,
        data.installment_max ?? 0,
        data.month_ref
      ]
    )
  },

  // update apenas se item pertencer ao usuário (usa subconsulta no WHERE)
  updateOwned: (id, userId, data) => {
    return db.query(
      `UPDATE financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       SET i.description = ?, i.type = ?, i.value = ?, i.recurring = ?,
           i.installment_now = ?, i.installment_max = ?, i.month_ref = ?
       WHERE i.id = ? AND e.user_id = ?`,
      [
        data.description ?? null,
        data.type ?? null,
        data.value ?? null,
        data.recurring ? 1 : 0,
        data.installment_now ?? 0,
        data.installment_max ?? 0,
        data.month_ref ?? null,
        id,
        userId
      ]
    )
  },

  // delete apenas se item pertencer ao usuário
  deleteOwned: (id, userId) => {
    return db.query(
      `DELETE i FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE i.id = ? AND e.user_id = ?`,
      [id, userId]
    )
  },

  // delete grupo de parcelas, garantindo posse pelo usuário
  deleteInstallmentGroupOwnedByItemId: async (id, userId) => {
    const [rows] = await db.query(
      `SELECT i.entity_id, i.description, i.installment_max
       FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE i.id = ? AND e.user_id = ?`,
      [id, userId]
    )
    if (!rows.length) return { affectedRows: 0 }

    const item = rows[0]
    const [res] = await db.query(
      `DELETE i FROM financial_items i
       JOIN financial_entities e ON e.id = i.entity_id
       WHERE i.entity_id = ? AND i.description = ? AND i.installment_max = ? AND e.user_id = ?`,
      [item.entity_id, item.description, item.installment_max, userId]
    )
    return res
  },

  createUnique: async (data, conn) => {
    const sql = `
      INSERT INTO financial_items 
      (entity_id, description, type, value, recurring, installment_now, installment_max, month_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const args = [
      data.entity_id,
      data.description,
      data.type,
      data.value,
      data.recurring ? 1 : 0,
      data.installment_now ?? 0,
      data.installment_max ?? 0,
      data.month_ref
    ]
    try {
      const [res] = await (conn || db).query(sql, args)
      return { insertId: res.insertId, skipped: false }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { insertId: null, skipped: true }
      }
      throw err
    }
  }
}