// itemModal.js
import { itemAPI } from '../../api.js'

export function showItemModal({ entityId, item = null, onSave, defaultMonthRef = null }) {
  const existingModal = document.getElementById('itemModal')
  if (existingModal) {
    bootstrap.Modal.getInstance(existingModal)?.hide()
    existingModal.remove()
  }

  const modalEl = document.createElement('div')
  modalEl.id = 'itemModal'
  modalEl.className = 'modal fade'
  modalEl.tabIndex = -1
  modalEl.innerHTML = `
    <div class="modal-dialog">
      <form class="modal-content bg-dark text-light">
        <div class="modal-header">
          <h5 class="modal-title">${item ? 'Editar' : 'Novo'} Item</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Descrição</label>
            <textarea name="description" class="form-control bg-dark text-light" required>${item?.description || ''}</textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Valor</label>
            <input name="value" type="number" step="0.01" class="form-control bg-dark text-light" required value="${item?.value || ''}">
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo</label>
            <select name="type" class="form-select bg-dark text-light2" required>
              <option value="entrada" ${item?.type === 'entrada' ? 'selected' : ''}>Entrada</option>
              <option value="saida" ${item?.type === 'saida' ? 'selected' : ''}>Saída</option>
            </select>
          </div>
          <div class="form-check mb-3">
            <input name="recurring" class="form-check-input bg-dark text-light" type="checkbox" ${item?.recurring ? 'checked' : ''}>
            <label class="form-check-label">Recorrente</label>
          </div>
          <div class="mb-3">
            <label class="form-label">Parcela Atual</label>
            <input name="installment_now" type="number" class="form-control bg-dark text-light" value="${item?.installment_now || 0}">
          </div>
          <div class="mb-3">
            <label class="form-label">Total de Parcelas</label>
            <input name="installment_max" type="number" class="form-control bg-dark text-light" value="${item?.installment_max || 0}">
          </div>
          <div class="mb-3">
            <label class="form-label">Mês de Referência</label>
            <input name="month_ref" type="date" class="form-control bg-dark text-light" required value="${
              item?.month_ref?.split('T')[0] ||
              (defaultMonthRef ? defaultMonthRef + '-01' : '')
            }">
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

    // Conversões:
    data.entity_id = entityId
    data.recurring = formData.get('recurring') === 'on'
    data.value = parseFloat(data.value)
    data.installment_now = parseInt(data.installment_now) || 0
    data.installment_max = parseInt(data.installment_max) || 0

    try {
      if (item) {
        await itemAPI.update(item.id, data)
      } else {
        await itemAPI.create(data)
      }
      modal.hide()
      if (onSave) onSave()
    } catch (err) {
      alert(`Erro ao salvar item: ${err.message}`)
    }
  })

  modalEl.addEventListener('hidden.bs.modal', () => {
    modalEl.remove()
  })
}
