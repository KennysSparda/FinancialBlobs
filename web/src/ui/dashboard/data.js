import { entityAPI, itemAPI } from '../../api.js'

export async function loadData() {
  let items = []
  try { items = await itemAPI.list() }
  catch {
    const withItems = await entityAPI.listWithItems()
    items = withItems.flatMap(e => (e.items||[]).map(it => ({ ...it, __entityName: e.name, __entityId: e.id })))
  }

  let entities = []
  try { entities = await entityAPI.list() }
  catch {
    const map = new Map()
    items.forEach(it => {
      if (it.__entityId && it.__entityName) map.set(it.__entityId, { id: it.__entityId, name: it.__entityName })
    })
    entities = [...map.values()]
  }

  return { entities, items }
}

export function getAmount(it) {
  const v = it.amount ?? it.value ?? it.total ?? it.price
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// /src/ui/dashboard/data.js
export function getDate(it) {
  const raw =
    it.month_ref ??          // backend usa muito este
    it.date ?? it.dueDate ?? it.createdAt ?? it.month

  if (!raw) return null

  // YYYY-MM ou YYYY/MM
  if (typeof raw === 'string' && /^\d{4}[-/]\d{2}$/.test(raw)) {
    const [y, mm] = raw.split(/[-/]/).map(Number)
    return new Date(y, mm - 1, 1)
  }

  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}


export function isIncome(it) {
  const t = (it.type ?? it.category ?? it.kind ?? '').toString().toLowerCase()
  if (t.includes('rece') || t.includes('income') || t.includes('entrada')) return true
  if (t.includes('desp') || t.includes('expense') || t.includes('saida') || t.includes('saída')) return false
  return getAmount(it) >= 0
}

export function getEntityKey(it) {
  return it.entityId ?? it.__entityId ?? it.entity_id ?? it.entity ?? 'desconhecida'
}

export function getEntityNameFromCache(entities, key) {
  const e = entities.find(x => x.id === key)
  return e?.name ?? key
}
