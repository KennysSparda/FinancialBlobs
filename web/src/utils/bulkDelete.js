// /src/ui/utils/bulkDelete.js
import { itemAPI } from '../api.js'

export async function deleteMonthItems(items, ym, { concurrency = 8 } = {}) {
  const toDelete = items.filter(i => String(i.month_ref).startsWith(ym))
  if (!toDelete.length) return { removed: 0 }

  await runInBatches(
    toDelete.map(it => () => itemAPI.remove(it.id, { scope: 'one' })),
    concurrency
  )

  return { removed: toDelete.length }
}

export async function deleteAllForEntity(items, { concurrency = 6 } = {}) {
  const { anchorsRecurring, anchorsInstallments, singles } = groupSeries(items)

  const tasks = [
    ...anchorsRecurring.map(it => () => itemAPI.remove(it.id, { scope: 'all' })),
    ...anchorsInstallments.map(it => () => itemAPI.remove(it.id, { scope: 'all' })),
    ...singles.map(it => () => itemAPI.remove(it.id, { scope: 'one' }))
  ]

  if (!tasks.length) return { seriesRemoved: 0, singlesRemoved: 0, totalCalls: 0 }

  await runInBatches(tasks, concurrency)

  return {
    seriesRemoved: anchorsRecurring.length + anchorsInstallments.length,
    singlesRemoved: singles.length,
    totalCalls: tasks.length
  }
}

function groupSeries(items) {
  const singles = []
  const recurring = new Map()
  const installments = new Map()

  for (const it of items) {
    if (it.installment_max > 1) {
      const key = `${it.entity_id}|${it.description}|${it.installment_max}|${it.type || ''}`
      const prev = installments.get(key)
      const candidate = pickInstallmentAnchor(prev, it)
      installments.set(key, candidate)
      continue
    }

    if (it.recurring) {
      const key = `${it.entity_id}|${it.description}|${it.type || ''}`
      const prev = recurring.get(key)
      const candidate = pickEarliest(prev, it)
      recurring.set(key, candidate)
      continue
    }

    singles.push(it)
  }

  return {
    anchorsRecurring: [...recurring.values()],
    anchorsInstallments: [...installments.values()],
    singles
  }
}

function pickEarliest(a, b) {
  if (!a) return b
  return String(a.month_ref) <= String(b.month_ref) ? a : b
}

function pickInstallmentAnchor(a, b) {
  if (!a) return b
  // preferir a 1ª parcela quando existir, senão a mais antiga
  if (a.installment_now === 1 && b.installment_now !== 1) return a
  if (b.installment_now === 1 && a.installment_now !== 1) return b
  return pickEarliest(a, b)
}

async function runInBatches(fns, size) {
  for (let i = 0; i < fns.length; i += size) {
    const slice = fns.slice(i, i + size)
    await Promise.all(slice.map(fn => fn()))
  }
}
