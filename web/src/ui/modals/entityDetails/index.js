import { buildEntityDetailsModal } from './build.js'
import { initItemsSection } from './items.js'
import { initConfigSection } from './config.js'

export function showEntityDetailsModal(entity, onUpdate) {
  const { modalEl } = buildEntityDetailsModal(entity)
  document.body.appendChild(modalEl)

  const modal = new bootstrap.Modal(modalEl)
  modal.show()

  const items = initItemsSection({ modalEl, entity, onUpdate })
  initConfigSection({ modalEl, entity, items, onUpdate, close: () => modal.hide() })

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove())
}
