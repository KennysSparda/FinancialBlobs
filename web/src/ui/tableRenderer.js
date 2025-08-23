// constrói o head de meses (sem a 1ª coluna)
export function buildMainTable() {
  const table = document.createElement('table')
  table.className = 'table table-sm align-middle w-100'

  const thead = document.createElement('thead')
  thead.className = 'table-dark text-center'
  const headerRow = document.createElement('tr')

  const monthNames = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ]
  const currentMonth = new Date().getMonth()

  for (let i = 0; i < 12; i++) {
    const th = document.createElement('th')
    th.textContent = monthNames[(currentMonth + i) % 12]
    headerRow.appendChild(th)
  }

  thead.appendChild(headerRow)
  table.appendChild(thead)

  return table
}

// constrói a tabela “congelada” da 1ª coluna (somente rótulos)
export function buildFrozenTable() {
  const table = document.createElement('table')
  table.className = 'table table-sm align-middle w-auto'

  const thead = document.createElement('thead')
  thead.className = 'table-dark text-center'
  const headerRow = document.createElement('tr')

  const th = document.createElement('th')
  th.className = 'col-entity'
  th.textContent = 'Entidade'
  headerRow.appendChild(th)

  thead.appendChild(headerRow)
  table.appendChild(thead)

  return table
}
