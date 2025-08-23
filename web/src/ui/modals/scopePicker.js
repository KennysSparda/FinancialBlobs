// /src/ui/modals/scopePicker.js
export function pickScope({ mode = 'update', defaultScope = 'one' } = {}) {
  return new Promise(resolve => {
    const id = 'scopePickerModal'
    document.getElementById(id)?.remove()

    const actionLabel = mode === 'delete' ? 'Remover' : 'Aplicar alterações'
    const title = mode === 'delete'
      ? 'Remover item recorrente/parcelado'
      : 'Atualizar item recorrente/parcelado'

    const el = document.createElement('div')
    el.id = id
    el.className = 'modal fade'
    el.tabIndex = -1
    el.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Escolha o escopo:</p>
            <div class="list-group">
              <label class="list-group-item">
                <input class="form-check-input me-2" type="radio" name="scope" value="one" ${defaultScope === 'one' ? 'checked' : ''}>
                Apenas este
                <div class="small text-muted">Afeta somente este registro</div>
              </label>
              <label class="list-group-item">
                <input class="form-check-input me-2" type="radio" name="scope" value="forward" ${defaultScope === 'forward' ? 'checked' : ''}>
                Este e os próximos
                <div class="small text-muted">Afeta a partir deste mês/parcela</div>
              </label>
              <label class="list-group-item">
                <input class="form-check-input me-2" type="radio" name="scope" value="all" ${defaultScope === 'all' ? 'checked' : ''}>
                Toda a série
                <div class="small text-muted">Afeta todos os meses/parcelas da série</div>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button id="cancelBtn" type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button id="okBtn" type="button" class="btn btn-primary">${actionLabel}</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(el)

    // padrão: permite fechar com backdrop/ESC; se quiser forçar escolha, use:
    // const modal = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false })
    const modal = new bootstrap.Modal(el, { backdrop: true, keyboard: true, focus: true })

    let resolved = false
    const finish = (value) => {
      if (resolved) return
      resolved = true
      modal.hide()
      // remove após animação
      el.addEventListener('hidden.bs.modal', () => el.remove(), { once: true })
      resolve(value)
    }

    el.querySelector('#okBtn').addEventListener('click', () => {
      const scope = el.querySelector('input[name="scope"]:checked')?.value || defaultScope
      finish(scope)
    })

    // cancelar via botão Cancelar
    el.querySelector('#cancelBtn').addEventListener('click', () => finish(null))

    // fechar via X, backdrop ou ESC → tratar como cancelado
    el.addEventListener('hidden.bs.modal', () => {
      if (!resolved) finish(null)
    }, { once: true })

    modal.show()
  })
}
