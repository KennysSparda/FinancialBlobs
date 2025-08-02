import { entityAPI } from '../api.js'
import { showEntityItems } from './modals/showEntityItems.js'
import { showItemModal } from './modals/itemModal.js' 

export function attachEntityClickHandlers() {
  document.querySelectorAll('.view-entity').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id
      const items = await entityAPI.getItems(id)
      showEntityItems(items)
    })
  })
  // Handler para botão + Item
  document.querySelectorAll('button.btn-outline-primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const entityId = e.target.dataset.entityId
      showItemModal({
        entityId,
        onSave: () => {
          // Re-renderize a tabela após salvar
          import('./renderEntityTable.js').then(({ renderEntityTable }) => renderEntityTable())
        }
      })
    })
  })
}

