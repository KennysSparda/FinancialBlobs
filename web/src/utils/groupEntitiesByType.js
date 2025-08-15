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
