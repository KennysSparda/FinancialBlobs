import { entityAPI } from '../api.js'
import { groupEntitiesByType } from '../utils/groupEntitiesByType.js'
import { buildMainTable, buildFrozenTable } from './tableRenderer.js'
import {
  frozenEntityRow, frozenTotalRow, frozenSaldoRow,
  mainEntityRow, mainTotalRow, mainSaldoRow
} from './tableRows.js'
import { attachEntityClickHandlers } from './entityHandlers.js'

export async function renderEntityTable() {
  const container = document.getElementById('app')
  container.innerHTML = ''

  const entities = await entityAPI.listWithItems()
  const grouped = groupEntitiesByType(entities)

  // layout split: coluna congelada + scroller
  const board = document.createElement('div')
  board.className = 'fb-board fb-split'

  const freeze = document.createElement('div')
  freeze.className = 'fb-freeze'
  const freezeTable = buildFrozenTable()

  const scroll = document.createElement('div')
  scroll.className = 'fb-scroll'
  const mainTable = buildMainTable()

  // monta linhas na MESMA ordem nos dois lados
  const fBody = document.createElement('tbody')
  const mBody = document.createElement('tbody')

  for (const tipo of ['entradas', 'saidas']) {
    const list = grouped[tipo]

    // entidades
    list.forEach(entity => {
      fBody.appendChild(frozenEntityRow(entity))
      mBody.appendChild(mainEntityRow(entity))
    })

    // total do bloco
    fBody.appendChild(frozenTotalRow(tipo))
    mBody.appendChild(mainTotalRow(list))
  }

  // saldo final
  fBody.appendChild(frozenSaldoRow())
  mBody.appendChild(mainSaldoRow(grouped.entradas, grouped.saidas))

  freezeTable.appendChild(fBody)
  mainTable.appendChild(mBody)

  freeze.appendChild(freezeTable)
  scroll.appendChild(mainTable)
  board.appendChild(freeze)
  board.appendChild(scroll)
  container.appendChild(board)

  // sincroniza alturas das linhas entre as duas tabelas
  const syncHeights = () => {
    // header
    const hL = freezeTable.querySelector('thead tr')
    const hR = mainTable.querySelector('thead tr')
    const headH = Math.max(hL.offsetHeight, hR.offsetHeight)
    hL.style.height = headH + 'px'
    hR.style.height = headH + 'px'

    // linhas
    const rowsL = freezeTable.querySelectorAll('tbody tr')
    const rowsR = mainTable.querySelectorAll('tbody tr')
    const len = Math.min(rowsL.length, rowsR.length)
    for (let i = 0; i < len; i++) {
      const h = Math.max(rowsL[i].offsetHeight, rowsR[i].offsetHeight)
      rowsL[i].style.height = h + 'px'
      rowsR[i].style.height = h + 'px'
    }
  }

  const ro = new ResizeObserver(() => syncHeights())
  ro.observe(scroll)
  ro.observe(freeze)
  window.addEventListener('load', syncHeights)
  requestAnimationFrame(syncHeights)

  attachEntityClickHandlers()
}
