// /api/core/financialEntityFactory.js

function financialEntityFactory(baseName, baseDescription, items = []) {
  if (!baseName || !baseDescription) return null

  const now = new Date()
  const month = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()

  const name = `${baseName} - ${month}/${year}`
  const description = `${baseDescription} referente ao mês de ${month} de ${year}`

  return {
    name,
    description,
    list: items.map(item => ({
      ...item,
      id: crypto.randomUUID(), // ou outro id
    }))
  }
}
module.exports = { financialEntityFactory }