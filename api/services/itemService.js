// /api/services/itemService.js
const dayjs = require('dayjs')
const ItemModel = require('../models/itemModel')
const EntityModel = require('../models/entityModel')

// normaliza para "YYYY-MM" com segurança
function monthKey(v) {
  if (!v) return ''
  if (typeof v === 'string') return v.slice(0, 7)
  try { return dayjs(v).format('YYYY-MM') } catch { return '' }
}

function buildKey({ description, type, value, installment_max, month_ref }) {
  return [
    String(description ?? ''),
    String(type ?? ''),
    Number(value ?? 0),
    Number(installment_max ?? 0),
    monthKey(month_ref)
  ].join('|')
}

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

  // 1) ownership da entidade
  const [entRows] = await EntityModel.getOwnedById(entity_id, userId)
  if (!entRows.length) {
    const e = new Error('Entidade não encontrada para este usuário')
    e.status = 404
    throw e
  }

  // 2) tamanho do lote (24 para recorrente; senão o range de parcelas)
  const start = dayjs(month_ref)
  const totalCount = recurring ? 24 : (installment_max - installment_now + 1)

  // 3) carrega existentes da ENTIDADE (owned) e prepara Set de chaves
  const [existing] = await ItemModel.getByEntityIdOwned(entity_id, userId)
  const existingKeys = new Set(existing.map(e => buildKey(e)))

  // 4) monta lote aplicando dedupe em memória
  const toInsert = []
  const skipped = []
  for (let i = 0; i < totalCount; i++) {
    const ref = start.add(i, 'month').format('YYYY-MM-DD')
    const candidate = {
      entity_id,
      description,
      type,
      value,
      recurring: !!recurring,
      installment_now: installment_now + i,
      installment_max,
      month_ref: ref
    }
    const key = buildKey(candidate)
    if (existingKeys.has(key)) {
      skipped.push({ month_ref: ref, description, value })
      continue
    }
    toInsert.push(candidate)
  }

  // 5) nada novo -> 409 (resposta esperada pelo teste)
  if (toInsert.length === 0) {
    const e = new Error('Itens já existem para os meses informados — nada foi criado')
    e.status = 409
    e.details = { skipped_count: skipped.length, skipped }
    throw e
  }

  // 6) inserir o que sobrou (se houver UNIQUE no banco, cai no fallback de DUP e conta como skipped)
  const ids = []
  for (const item of toInsert) {
    try {
      if (typeof ItemModel.createUnique === 'function') {
        const { insertId, skipped: dup } = await ItemModel.createUnique(item)
        if (dup) {
          skipped.push({ month_ref: item.month_ref, description: item.description, value: item.value })
          continue
        }
        ids.push(insertId)
      } else {
        const [res] = await ItemModel.create(item)
        ids.push(res.insertId)
      }
    } catch (err) {
      // se houver UNIQUE e colidir, trata como "skipped"
      if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
        skipped.push({ month_ref: item.month_ref, description: item.description, value: item.value })
        continue
      }
      // qualquer outro erro real deve emergir
      throw err
    }
  }

  // 7) se, por causa do UNIQUE, nada foi criado de fato -> 409
  if (ids.length === 0) {
    const e = new Error('Itens já existem para os meses informados — nada foi criado')
    e.status = 409
    e.details = { skipped_count: skipped.length, skipped }
    throw e
  }

  return {
    created_count: ids.length,
    skipped_count: skipped.length,
    ids,
    skipped
  }
}

module.exports = { createWithRules }
