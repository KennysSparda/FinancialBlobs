import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'

function handleAddEntity() {
  alert('Abrir modal de criação de entidade') // depois você troca isso por lógica real
}

renderNavbar({ onAddEntity: handleAddEntity })
renderEntityTable()
