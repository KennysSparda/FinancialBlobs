// /api/services/monthGenerator.js

const db = require('../utils/db')
const { financialEntityFactory } = require('../core/financialEntityFactory')

async function ensureNextMonths(fromMonth) {
  const date = new Date(fromMonth)
  const monthRefs = []

  for (let i = 1; i <= 11; i++) {
    const next = new Date(date.getFullYear(), date.getMonth() + i, 1)
    const iso = next.toISOString().split('T')[0]
    monthRefs.push(iso)
  }

  const [rows] = await db.query(
    `SELECT DISTINCT month_ref FROM financial_entities 
     WHERE month_ref IN (${monthRefs.map(() => '?').join(',')})`,
    monthRefs
  )

  const existingRefs = rows.map(r => r.month_ref.toISOString().split('T')[0])
  const missingRefs = monthRefs.filter(ref => !existingRefs.includes(ref))

  for (const ref of missingRefs) {
    await generateNextMonth(ref)
  }

  return { generated: missingRefs }
}


async function generateNextMonth(currentDate) {
  const date = new Date(currentDate)
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  const formatted = nextMonth.toISOString().split('T')[0] // YYYY-MM-DD

  const [entities] = await db.query(
    `SELECT fe.*, fi.* FROM financial_entities fe 
     JOIN financial_items fi ON fe.id = fi.entity_id
     WHERE fe.month_ref = ?`,
    [currentDate]
  )

  const groupedByEntity = {}

  for (const row of entities) {
    if (!groupedByEntity[row.id]) {
      groupedByEntity[row.id] = {
        name: row.name,
        description: row.description,
        items: []
      }
    }

    const shouldCopy =
      row.recurring === 1 || (row.installment_now < row.installment_max)

    if (shouldCopy) {
      groupedByEntity[row.id].items.push({
        description: row.description,
        type: row.type,
        value: row.value,
        recurring: row.recurring,
        installment_now: row.recurring ? 1 : row.installment_now + 1,
        installment_max: row.installment_max
      })
    }
  }

  for (const entity of Object.values(groupedByEntity)) {
    const newEntity = financialEntityFactory(
      entity.name.replace(/ - .*/, ''), // Remove mês/ano do nome
      entity.description,
      entity.items
    )

    const [res] = await db.query(
      'INSERT INTO financial_entities (name, description, month_ref) VALUES (?, ?, ?)',
      [newEntity.name, newEntity.description, formatted]
    )

    const entityId = res.insertId

    for (const item of newEntity.list) {
      await db.query(
        `INSERT INTO financial_items 
        (entity_id, description, type, value, recurring, installment_now, installment_max) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          entityId,
          item.description,
          item.type,
          item.value,
          item.recurring,
          item.installment_now,
          item.installment_max
        ]
      )
    }
  }

  return { message: 'Novo mês gerado com sucesso!', reference: formatted }
}
module.exports = {
  ensureNextMonths,
  generateNextMonth
}