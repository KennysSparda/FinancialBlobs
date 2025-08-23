// /api/models/itemModel.js
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
  },

  async updateRecurringSeriesOwnedByAnchor(anchor, userId, scope, data) {
    // série recorrente: mesma entidade, recorrente=1, mesma descrição+tipo
    // forward: meses >= anchor.month_ref
    const sets = []
    const args = []

    if (typeof data.description !== 'undefined') {
      sets.push('i.description = ?')
      args.push(data.description)
    }
    if (typeof data.type !== 'undefined') {
      sets.push('i.type = ?')
      args.push(data.type)
    }
    if (typeof data.value !== 'undefined') {
      sets.push('i.value = ?')
      args.push(data.value)
    }

    if (!sets.length) return { affectedRows: 0 }

    let sql = `
      UPDATE financial_items i
      JOIN financial_entities e ON e.id = i.entity_id
      SET ${sets.join(', ')}
      WHERE i.entity_id = ?
        AND i.recurring = 1
        AND i.description = ?
        AND i.type = ?
        AND e.user_id = ?
    `
    args.push(anchor.entity_id, anchor.description, anchor.type, userId)

    if (scope === 'forward') {
      sql += ' AND i.month_ref >= ?'
      args.push(anchor.month_ref)
    }

    const [res] = await db.query(sql, args)
    return res
  },

  async deleteRecurringSeriesOwnedByAnchor(anchor, userId, scope) {
    let sql = `
      DELETE i FROM financial_items i
      JOIN financial_entities e ON e.id = i.entity_id
      WHERE i.entity_id = ?
        AND i.recurring = 1
        AND i.description = ?
        AND i.type = ?
        AND e.user_id = ?
    `
    const args = [anchor.entity_id, anchor.description, anchor.type, userId]

    if (scope === 'forward') {
      sql += ' AND i.month_ref >= ?'
      args.push(anchor.month_ref)
    }

    const [res] = await db.query(sql, args)
    return res
  },

  async updateInstallmentSeriesOwnedByAnchor(anchor, userId, scope, data) {
    // série parcelada: mesma entidade, mesma descrição, mesmo installment_max
    const sets = []
    const args = []

    if (typeof data.description !== 'undefined') {
      sets.push('i.description = ?')
      args.push(data.description)
    }
    if (typeof data.value !== 'undefined') {
      sets.push('i.value = ?')
      args.push(data.value)
    }
    if (!sets.length) return { affectedRows: 0 }

    let sql = `
      UPDATE financial_items i
      JOIN financial_entities e ON e.id = i.entity_id
      SET ${sets.join(', ')}
      WHERE i.entity_id = ?
        AND i.description = ?
        AND i.installment_max = ?
        AND e.user_id = ?
    `
    args.push(anchor.entity_id, anchor.description, anchor.installment_max, userId)

    if (scope === 'forward') {
      sql += ' AND i.installment_now >= ?'
      args.push(anchor.installment_now)
    }

    const [res] = await db.query(sql, args)
    return res
  },

  async deleteInstallmentSeriesOwnedByAnchor(anchor, userId, scope) {
    let sql = `
      DELETE i FROM financial_items i
      JOIN financial_entities e ON e.id = i.entity_id
      WHERE i.entity_id = ?
        AND i.description = ?
        AND i.installment_max = ?
        AND e.user_id = ?
    `
    const args = [anchor.entity_id, anchor.description, anchor.installment_max, userId]

    if (scope === 'forward') {
      sql += ' AND i.installment_now >= ?'
      args.push(anchor.installment_now)
    }

    const [res] = await db.query(sql, args)
    return res
  }
}