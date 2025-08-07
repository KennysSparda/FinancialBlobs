export function buildEntityTable() {
  const table = document.createElement('table')
  table.className = 'table table-bordered table-sm align-middle table-striped'

  const thead = document.createElement('thead')
  thead.className = 'table-dark text-center'

  const headerRow = document.createElement('tr')

  const firstCol = document.createElement('th')
  firstCol.textContent = 'Entidade'
  headerRow.appendChild(firstCol)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const now = new Date()
  const currentMonth = now.getMonth()

  // Gera os nomes dos 12 meses a partir do mês atual
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12
    const th = document.createElement('th')
    th.textContent = monthNames[monthIndex]
    headerRow.appendChild(th)
  }

  thead.appendChild(headerRow)
  table.appendChild(thead)

  return table
}
