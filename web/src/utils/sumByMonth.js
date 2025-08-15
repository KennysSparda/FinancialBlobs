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
