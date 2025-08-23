import { entityAPI, itemAPI } from '../../api.js'

export function showEntityDetailsModal(entity, onUpdate) {
  const modalEl = document.createElement('div')
  modalEl.className = 'modal fade'
  modalEl.tabIndex = -1

  modalEl.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content border-0 shadow">
        <div class="modal-header">
          <h5 class="modal-title">${entity.name}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <p class="mb-3">${entity.description || 'Sem descrição'}</p>

          <ul class="nav nav-tabs" id="entityTab" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-items" type="button">Itens</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-config" type="button">Configurações</button>
            </li>
          </ul>

          <div class="tab-content mt-3">
            <div class="tab-pane fade show active" id="tab-items">
              <div class="mb-2 d-flex justify-content-between align-items-center">
                <label class="form-label mb-0">
                  Mês de referência:
                  <select class="form-select form-select-sm d-inline w-auto" id="monthSelector"></select>
                </label>
              </div>

              <table class="table table-sm">
                <thead class="table-dark">
                  <tr>
                    <th>Mês</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Parc. Atual</th>
                    <th>Parc. Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="itemsTableBody"></tbody>
              </table>
              <button class="btn btn-sm btn-outline-primary" id="addItemBtn">+ Item</button>
            </div>

            <div class="tab-pane fade" id="tab-config">
              <div id="configContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modalEl)
  const modal = new bootstrap.Modal(modalEl)
  modal.show()

  const monthSelector = modalEl.querySelector('#monthSelector')
  let freshItems = []

  const renderItems = async () => {
    const body = modalEl.querySelector('#itemsTableBody')
    body.innerHTML = ''

    if (!freshItems.length) {
      const previousSelectedMonth = monthSelector.value
      freshItems = await entityAPI.getItems(entity.id)

      monthSelector.innerHTML = ''
      const uniqueMonths = [...new Set(freshItems.map(i => i.month_ref.slice(0, 7)))].sort()
      for (const month of uniqueMonths) {
        const opt = document.createElement('option')
        opt.value = month
        const [y, m] = month.split('-').map(Number)
        opt.textContent = new Date(y, m - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        monthSelector.appendChild(opt)
      }

      if (previousSelectedMonth && uniqueMonths.includes(previousSelectedMonth)) {
        monthSelector.value = previousSelectedMonth
      } else {
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthSelector.value = uniqueMonths.includes(currentMonth) ? currentMonth : uniqueMonths[0]
      }
    }

    const selectedMonth = monthSelector.value
    const filtered = freshItems
      .filter(i => i.month_ref.startsWith(selectedMonth))
      .sort((a, b) => {
        if (a.installment_max > 1 && b.installment_max <= 1) return -1
        if (a.installment_max <= 1 && b.installment_max > 1) return 1
        return 0
      })

    if (!filtered.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted">Nenhum item neste mês.</td></tr>`
      return
    }

    for (const item of filtered) {
      const row = document.createElement('tr')
      const color = item.type === 'entrada' ? 'var(--fb-success)' : 'var(--fb-danger)'
      row.innerHTML = `
        <td>${item.month_ref.slice(0, 7)}</td>
        <td>${item.description}</td>
        <td>
          <span class="currency" style="color:${color}">
            <span class="currency__symbol" aria-hidden="true">R$</span>
            <span class="currency__amount">
              ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </td>
        <td>${item.installment_now}</td>
        <td>${item.installment_max}</td>
        <td>
          <button class="btn btn-sm btn-link text-primary edit-item" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-link text-danger delete-item" data-id="${item.id}">Remover</button>
        </td>
      `
      body.appendChild(row)
    }

    body.querySelectorAll('.edit-item').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.dataset.id
        const item = freshItems.find(i => i.id == itemId)
        import('./itemModal.js').then(({ showItemModal }) =>
          showItemModal({
            item,
            onSave: () => {
              freshItems = []
              renderItems()
              if (onUpdate) onUpdate()
            }
          })
        )
      }
    })

    body.querySelectorAll('.delete-item').forEach(btn => {
      btn.onclick = async () => {
        const itemId = btn.dataset.id
        if (confirm('Remover item?')) {
          await itemAPI.remove(itemId)
          freshItems = []
          renderItems()
          if (onUpdate) onUpdate()
        }
      }
    })
  }

  renderItems()
  monthSelector.addEventListener('change', renderItems)

  modalEl.querySelector('#addItemBtn').addEventListener('click', () => {
    const selectedMonth = monthSelector.value
    import('./itemModal.js').then(({ showItemModal }) =>
      showItemModal({
        entityId: entity.id,
        defaultMonthRef: selectedMonth,
        onSave: () => {
          freshItems = []
          renderItems()
          if (onUpdate) onUpdate()
        }
      })
    )
  })

  import('./entityModal.js').then(({ showEntityModal }) => {
    const configDiv = modalEl.querySelector('#configContainer')
    const editBtn = document.createElement('button')
    editBtn.className = 'btn btn-warning btn-sm mb-3'
    editBtn.textContent = 'Editar Entidade'
    editBtn.onclick = () => {
      showEntityModal(entity, () => {
        modal.hide()
        if (onUpdate) onUpdate()
      })
    }
    configDiv.appendChild(editBtn)

    if (entity?.id) {
      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'btn btn-danger btn-sm ms-2 mb-3'
      deleteBtn.textContent = 'Deletar Entidade'
      deleteBtn.onclick = async () => {
        if (confirm('Tem certeza que deseja deletar esta entidade?')) {
          await entityAPI.remove(entity.id)
          modal.hide()
          if (onUpdate) onUpdate()
        }
      }
      configDiv.appendChild(deleteBtn)
    }
  })

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove())
}
