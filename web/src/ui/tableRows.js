// /src/tableRows
import { sumByMonth } from '../utils/sumByMonth.js'
import { calculateTotals } from '../utils/calculateTotals.js'

export function createEntityRow(entity) {
  const row = document.createElement('tr')

  row.classList.add('table-dark')

  const monthlyCells = Array.from({ length: 12 }, (_, i) =>
    `<td>${styledValue(sumByMonth(entity.items, i))}</td>`
  ).join('')
  row.innerHTML = `
    <td>
      <button
        class="btn btn-link p-0 m-0 view-entity w-100 text-start"
        data-id="${entity.id}"
        title="${entity.description || ''}">
        ${entity.name}
      </button>
    </td>
    ${monthlyCells}
  `
  return row
}

export function createTotalRow(tipo, list) {
  const total = calculateTotals(list)
  const monthlyCells = total.map(value =>
    `<td><strong>${styledValue(value)}</strong></td>`
  ).join('')

  const row = document.createElement('tr')
  row.classList.add('table-dark', 'text-start')
  row.innerHTML = `<td><strong>Total de ${tipo}</strong></td>${monthlyCells}`
  return row
}

export function createSaldoFinalRow(entradas, saidas) {
  const saldo = calculateTotals([...entradas, ...saidas])
  const monthlyCells = saldo.map(value =>
    `<td><strong>${styledValue(value)}</strong></td>`
  ).join('')

  const row = document.createElement('tr')
  row.classList.add('table-dark')
  row.innerHTML = `<td><strong>Saldo Final</strong></td>${monthlyCells}`
  return row
}

function styledValue(value) {
  const floatVal = parseFloat(value)
  const colorClass =
    floatVal > 0 ? 'text-success'
    : floatVal < 0 ? 'text-danger'
    : 'text-muted'
  return `<span class="${colorClass}">R$ ${floatVal.toFixed(2)}</span>`
}

