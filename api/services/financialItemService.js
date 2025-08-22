// /api/services/financialItemService.js
const FinancialItem = require('../models/financialItemModel')
const FinancialEntity = require('../models/financialEntityModel')
const dayjs = require('dayjs')

// Agora exige userId para validar ownership
async function createWithRules(itemData, userId) {
  const {
    entity_id,
    description,
    type,
    value,
    recurring,
    installment_now = 1,
    installment_max = 1,
    month_ref
  } = itemData

  // 1) valida posse da entidade
  const [entityRows] = await FinancialEntity.getOwnedById(entity_id, userId)
  if (!entityRows.length) {
    const err = new Error('Entidade não encontrada')
    err.status = 404
    throw err
  }

  // 2) base para evitar duplicidade
  const [existing] = await FinancialItem.getByEntityIdOwned(entity_id, userId)

  const itemsToInsert = []
  const startMonth = dayjs(month_ref)

  // mesma lógica: recorrente => 24 meses, senão (parcelas restantes)
  const count = recurring ? 24 : (installment_max - installment_now + 1)

  for (let i = 0; i < count; i++) {
    const currentInstallment = installment_now + i
    const ref = startMonth.add(i, 'month').format('YYYY-MM-DD')

    // evita duplicidade pra recorrentes ou parcelados com mesmo valor e mesma competência
    const duplicate = (recurring || installment_max > 1) && existing.find(e =>
      e.description === description &&
      Number(e.value) === Number(value) &&
      dayjs(e.month_ref).format('YYYY-MM') === ref.slice(0, 7)
    )

    if (duplicate) continue

    itemsToInsert.push({
      entity_id,
      description,
      type,
      value,
      recurring,
      installment_now: currentInstallment,
      installment_max,
      month_ref: ref
    })
  }

  const ids = []
  for (const item of itemsToInsert) {
    const [res] = await FinancialItem.create(item)
    ids.push(res.insertId)
  }

  return ids
}

module.exports = {
  createWithRules
}
