import { entityAPI } from '../api.js'
import { showModal } from '../modal.js'

export function attachEntityClickHandlers() {
  document.querySelectorAll('.view-entity').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id
      const items = await entityAPI.getItems(id)
      showModal(items)
    })
  })
}
