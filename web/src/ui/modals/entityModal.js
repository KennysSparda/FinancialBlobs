// /src/ui/modals/entityModal.js
import { entityAPI } from '../../api.js'

export function showEntityModal(entity = null, onSave) {
  const modalEl = document.createElement('div')
  modalEl.className = 'modal fade'
  modalEl.tabIndex = -1
  modalEl.innerHTML = `
    <div class="modal-dialog">
      <form class="modal-content bg-dark text-light">
        <div class="modal-header">
          <h5 class="modal-title">${entity ? 'Editar' : 'Nova'} Entidade</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Nome</label>
            <input name="name" type="text" class="form-control bg-dark text-light" required value="${entity?.name || ''}">
          </div>
          <div class="mb-3">
            <label class="form-label">Descrição</label>
            <textarea name="description" class="form-control bg-dark text-light">${entity?.description || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modalEl)
  const modal = new bootstrap.Modal(modalEl)
  modal.show()

  modalEl.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())

    try {
      if (entity) {
        await entityAPI.update(entity.id, data)
      } else {
        await entityAPI.create(data)
      }
      modal.hide()
      if (onSave) onSave()
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`)
    }
  })

  modalEl.addEventListener('hidden.bs.modal', () => {
    modalEl.remove()
  })
}
