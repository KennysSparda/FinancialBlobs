import { sumByMonth } from '../utils/sumByMonth.js'

// ===== linhas da TABELA CONGELADA (só 1ª coluna) =====
export function frozenEntityRow(entity) {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <th scope="row" class="col-entity">
      <button
        class="btn btn-link p-0 m-0 view-entity w-100 text-start"
        data-id="${entity.id}"
        title="${entity.description || ''}">
        ${entity.name}
      </button>
    </th>
  `
  return tr
}

export function frozenTotalRow(tipo) {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <th scope="row" class="col-entity"><strong>Total de ${tipo}</strong></th>
  `
  return tr
}

export function frozenSaldoRow() {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <th scope="row" class="col-entity"><strong>Saldo Final</strong></th>
  `
  return tr
}

// ===== linhas da TABELA PRINCIPAL (12 meses) =====
export function mainEntityRow(entity) {
  const tr = document.createElement('tr')
  tr.innerHTML = Array.from({ length: 12 }, (_, i) =>
    `<td>${styledValue(sumByMonth(entity.items, i))}</td>`
  ).join('')
  return tr
}

export function mainTotalRow(list) {
  const totals = totalsByMonth(list)
  const tr = document.createElement('tr')
  tr.innerHTML = totals.map(v => `<td><strong>${styledValue(v)}</strong></td>`).join('')
  return tr
}

export function mainSaldoRow(entradas, saidas) {
  const e = totalsByMonth(entradas)
  const s = totalsByMonth(saidas)
  const saldo = e.map((v, i) => v - s[i])

  const tr = document.createElement('tr')
  tr.innerHTML = saldo.map(v => `<td><strong>${styledValue(v)}</strong></td>`).join('')
  return tr
}

// util: soma por mês para lista de entidades
function totalsByMonth(list) {
  return Array.from({ length: 12 }, (_, i) =>
    list.reduce((acc, e) => acc + sumByMonth(e.items, i), 0)
  )
}

// moeda com símbolo responsivo
function styledValue(value) {
  const n = Number(value) || 0
  const colorClass = n > 0 ? 'text-success' : n < 0 ? 'text-danger' : 'text-muted'
  const amount = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return `
    <span class="currency ${colorClass}">
      <span class="currency__symbol" aria-hidden="true">R$</span>
      <span class="currency__amount">${amount}</span>
    </span>
  `
}
