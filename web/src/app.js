import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'

function refresh() {
  renderEntityTable()
}

renderNavbar({ onAddEntity: refresh })
refresh()
