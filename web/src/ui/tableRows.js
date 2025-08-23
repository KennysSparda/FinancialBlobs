import { sumByMonth } from '../utils/sumByMonth.js'
import { calculateTotals } from '../utils/calculateTotals.js'

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
    `<td>${styledValue(sumByMonth(entity?.items || [], i))}</td>`
  ).join('')
  return tr
}

export function mainTotalRow(list) {
  const totals = calculateTotals(list)
  const tr = document.createElement('tr')
  tr.innerHTML = totals.map(v => `<td><strong>${styledValue(v)}</strong></td>`).join('')
  return tr
}

export function mainSaldoRow(entradas, saidas) {
  const e = calculateTotals(entradas)      // ex.: [2500, 0, ...]
  const s = calculateTotals(saidas)        // ex.: [-431.35, -239.52, ...]

  // saldo mês a mês = entradas + saídas (saídas já vêm negativas)
  const saldo = e.map((v, i) => Number(v) + Number(s[i] || 0))

  const tr = document.createElement('tr')
  tr.innerHTML = saldo.map(v => `<td><strong>${styledValue(v)}</strong></td>`).join('')
  return tr
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
