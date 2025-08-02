import { entityAPI } from './api.js'
import { showModal } from './modal.js'
import { groupEntitiesByType, calculateTotals, sumByMonth } from './utils.js'

export async function renderEntityTable() {
  const container = document.getElementById('entityTable')
  const entities = await entityAPI.listWithItems()
  entities.forEach(ent => {
    ent.items.forEach(item => {
      item.month_ref = ent.month_ref
    })
  })

  const grouped = groupEntitiesByType(entities)
  const table = document.createElement('table')
  table.className = 'table table-bordered table-sm align-middle'

  const header = `
    <thead class="table-light">
      <tr>
        <th>Entidade</th>
        <th>Mês Atual</th>
        <th>Próximo Mês</th>
        <th>+ Meses...</th>
      </tr>
    </thead>
  `
  const rows = []

  for (const tipo of ['entradas', 'saidas']) {
    const list = grouped[tipo]
    console.log(grouped)
    list.forEach(entity => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td><button class="btn btn-link p-0 view-entity" data-id="${entity.id}">${entity.name}</button></td>
        <td>R$ ${sumByMonth(entity.items, 0)}</td>
        <td>R$ ${sumByMonth(entity.items, 1)}</td>
        <td>R$ ${sumByMonth(entity.items, 2)}</td>
      `
      rows.push(row)
    })

    const total = calculateTotals(list)
    const totalRow = document.createElement('tr')
    totalRow.innerHTML = `
      <td><strong>Total de ${tipo}</strong></td>
      <td><strong>R$ ${total[0]}</strong></td>
      <td><strong>R$ ${total[1]}</strong></td>
      <td><strong>R$ ${total[2]}</strong></td>
    `
    totalRow.classList.add('table-secondary')
    rows.push(totalRow)
  }

  const saldo = calculateTotals([...grouped.entradas, ...grouped.saidas], true)
  const saldoRow = document.createElement('tr')
  saldoRow.innerHTML = `
    <td><strong>Saldo Final</strong></td>
    <td><strong>R$ ${saldo[0]}</strong></td>
    <td><strong>R$ ${saldo[1]}</strong></td>
    <td><strong>R$ ${saldo[2]}</strong></td>
  `
  saldoRow.classList.add('table-success')
  rows.push(saldoRow)

  table.innerHTML = header
  rows.forEach(r => table.appendChild(r))
  container.innerHTML = ''
  container.appendChild(table)

  document.querySelectorAll('.view-entity').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id
      const items = await entityAPI.getItems(id)
      showModal(items)
    })
  })
}
