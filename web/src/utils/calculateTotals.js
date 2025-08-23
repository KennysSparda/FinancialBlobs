import { sumByMonth } from './sumByMonth.js'

export function calculateTotals(entities) {
  const monthsToShow = 12
  const result = new Array(monthsToShow).fill(0)

  const list = Array.isArray(entities) ? entities : []
  list.forEach(ent => {
    const items = ent?.items || []
    for (let i = 0; i < monthsToShow; i++) {
      result[i] += Number(sumByMonth(items, i) || 0)
    }
  })

  return result // <- números
}
