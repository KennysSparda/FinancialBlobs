import { sumByMonth, calculateTotals } from '../utils.js'

export function createEntityRow(entity) {
  const row = document.createElement('tr')
  row.innerHTML = `
    <td><button class="btn btn-link p-0 view-entity" data-id="${entity.id}">${entity.name}</button></td>
    <td>${styledValue(sumByMonth(entity.items, 0))}</td>
    <td>${styledValue(sumByMonth(entity.items, 1))}</td>
    <td>${styledValue(sumByMonth(entity.items, 2))}</td>
  `


  // Criar célula extra para o botão + Item
  const btnCell = document.createElement('td')
  const btnAddItem = document.createElement('button')
  btnAddItem.textContent = '+ Item'
  btnAddItem.className = 'btn btn-sm btn-outline-primary ms-2'
  btnAddItem.dataset.entityId = entity.id

  btnCell.appendChild(btnAddItem)
  row.appendChild(btnCell)
  return row
}

export function createTotalRow(tipo, list) {
  const total = calculateTotals(list)
  const row = document.createElement('tr')
  // row.classList.add('table-secondary')
  row.innerHTML = `
    <td><strong>Total de ${tipo}</strong></td>
    <td><strong>${styledValue(total[0])}</strong></td>
    <td><strong>${styledValue(total[1])}</strong></td>
    <td><strong>${styledValue(total[2])}</strong></td>
    <td></td>
  `
  return row
}

export function createSaldoFinalRow(entradas, saidas) {
  const saldo = calculateTotals([...entradas, ...saidas])
  const row = document.createElement('tr')
  // row.classList.add('table-success')
  row.innerHTML = `
    <td><strong>Saldo Final</strong></td>
    <td><strong>${styledValue(saldo[0])}</strong></td>
    <td><strong>${styledValue(saldo[1])}</strong></td>
    <td><strong>${styledValue(saldo[2])}</strong></td>
    <td></td>
  `
  return row
}

function styledValue(value) {
  const floatVal = parseFloat(value)
  const colorClass = floatVal > 0 ? 'text-success' : floatVal < 0 ? 'text-danger' : 'text-muted'
  return `<span class="${colorClass}">R$ ${parseFloat(value).toFixed(2)}</span>`
}
