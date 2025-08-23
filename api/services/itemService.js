// /api/services/itemService.js
const dayjs = require('dayjs')
const ItemModel = require('../models/itemModel')
const EntityModel = require('../models/entityModel')

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

  // 1) valida ownership da entidade
  const [entRows] = await EntityModel.getOwnedById(entity_id, userId)
  if (!entRows.length) {
    const e = new Error('Entidade não encontrada para este usuário')
    e.status = 404
    throw e
  }

  // 2) prepara a sequência
  const start = dayjs(month_ref)
  const count = recurring ? 24 : (installment_max - installment_now + 1)
  const toInsert = Array.from({ length: count }, (_, i) => ({
    entity_id,
    description,
    type,
    value,
    recurring: !!recurring,
    installment_now: installment_now + i,
    installment_max,
    month_ref: start.add(i, 'month').format('YYYY-MM-DD')
  }))

  // 3) insere com proteção de índice único
  const created = []
  const skipped = []
  for (const item of toInsert) {
    const { insertId, skipped: isDup } = await ItemModel.createUnique(item)
    if (isDup) {
      skipped.push({ month_ref: item.month_ref, description, value })
    } else {
      created.push(insertId)
    }
  }

  // 4) sem novos itens → 409
  if (created.length === 0) {
    const e = new Error('Itens já existem para os meses informados — nada foi criado')
    e.status = 409
    e.details = { skipped_count: skipped.length, skipped }
    throw e
  }

  // 5) retorno feliz
  return {
    created_count: created.length,
    skipped_count: skipped.length,
    ids: created,
    skipped
  }
}

module.exports = { createWithRules }
