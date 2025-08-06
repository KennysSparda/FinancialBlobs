// utils.js
export function sumByMonth(items, offset = 0) {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() + offset)
  const refMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

  return items
    .filter(item => {
      const itemDate = new Date(item.month_ref)
      const itemMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`
      return itemMonth === refMonth
    })
    .reduce((acc, curr) => acc + parseFloat(curr.value) * (curr.type === 'entrada' ? 1 : -1), 0)
    .toFixed(2)
}



export function groupEntitiesByType(entities) {
  const entradas = []
  const saidas = []
  for (const entity of entities) {
    const onlyEntradas = entity.items.every(i => i.type === 'entrada')
    if (onlyEntradas) entradas.push(entity)
    else saidas.push(entity)
  }
  return { entradas, saidas }
}

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

// Retorna o índice real do mês no ano baseado na posição da coluna
export function getRotatedMonthIndex(columnIndex, startMonth = new Date().getMonth()) {
  return (startMonth + columnIndex) % 12
}
