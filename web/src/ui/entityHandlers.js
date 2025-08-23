// /src/entityHandlers.js
import { entityAPI } from '../api.js'

import { showEntityDetailsModal } from './modals/entityDetails.js'

export function attachEntityClickHandlers() {
  document.querySelectorAll('.view-entity').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id
      const entity = await entityAPI.get(id)
      showEntityDetailsModal(entity, () => {
        import('./renderEntityTable.js').then(({ renderEntityTable }) => renderEntityTable())
      })
    })
  })
}

