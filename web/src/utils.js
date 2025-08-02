export function sumByMonth(items, offset = 0) {
  const now = new Date()
  const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1 + offset).padStart(2, '0')}`

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
  const result = [0, 0, 0]
  entities.forEach(ent => {
    for (let i = 0; i < 3; i++) {
      const valor = sumByMonth(ent.items, i)
      result[i] += parseFloat(valor)
    }
  })
  return result.map(v => v.toFixed(2))
}
