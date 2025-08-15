import { sumByMonth } from "./sumByMonth.js"

export function calculateTotals(entities, final = false) {
  const monthsToShow = 12
  const result = new Array(monthsToShow).fill(0)

  entities.forEach(ent => {
    for (let i = 0; i < monthsToShow; i++) {
      const valor = sumByMonth(ent.items, i)
      result[i] += parseFloat(valor)
    }
  })

  return result.map(v => v.toFixed(2))
}
