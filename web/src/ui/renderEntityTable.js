import { entityAPI } from '../api.js'
import { groupEntitiesByType } from '../utils/groupEntitiesByType.js'
import { buildEntityTable } from './tableRenderer.js'
import { createEntityRow, createTotalRow, createSaldoFinalRow } from './tableRows.js'
import { attachEntityClickHandlers } from './entityHandlers.js'

export async function renderEntityTable() {
  const container = document.getElementById('entityTable')

  const entities = await entityAPI.listWithItems()

  const grouped = groupEntitiesByType(entities)
  const table = buildEntityTable()

  for (const tipo of ['entradas', 'saidas']) {
    const list = grouped[tipo]
    list.forEach(entity => table.appendChild(createEntityRow(entity)))
    table.appendChild(createTotalRow(tipo, list))
  }

  table.appendChild(createSaldoFinalRow(grouped.entradas, grouped.saidas))

  container.innerHTML = ''
  const panel = document.createElement('div')
  panel.className = 'fb-board'
  const scroll = document.createElement('div')
  scroll.className = 'fb-scroll'
  scroll.appendChild(table)
  panel.appendChild(scroll)
  container.appendChild(panel)

  attachEntityClickHandlers()
}
