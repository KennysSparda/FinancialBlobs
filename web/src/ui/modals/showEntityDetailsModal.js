import { entityAPI, itemAPI } from '../../api.js'
export function showEntityDetailsModal(entity, onUpdate) {
  const modalEl = document.createElement('div')
  modalEl.className = 'modal fade'
  modalEl.tabIndex = -1

  modalEl.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${entity.name}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <p class="text-muted">${entity.description || 'Sem descrição'}</p>

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
                <thead>
                  <tr>
                    <th>Mes</th>
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

  // Recarregar tabela de itens
  const monthSelector = modalEl.querySelector('#monthSelector')

  let freshItems = []

  const renderItems = async () => {

    const body = modalEl.querySelector('#itemsTableBody')
    body.innerHTML = ''

    // Pega todos os itens apenas uma vez (cache local)
    if (!freshItems.length) {
      freshItems = await entityAPI.getItems(entity.id)
      // Preencher seletor de meses
      monthSelector.innerHTML = ''
      const uniqueMonths = [...new Set(freshItems.map(item => item.month_ref.slice(0, 7)))].sort().reverse()
      for (const month of uniqueMonths) {
        const option = document.createElement('option')
        option.value = month
        option.textContent = new Date(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        monthSelector.appendChild(option)
      }

      // Define mês atual como selecionado (padrão)
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      monthSelector.value = uniqueMonths.includes(currentMonth) ? currentMonth : uniqueMonths[0]
    }

    const selectedMonth = monthSelector.value
    const filteredItems = freshItems.filter(item => item.month_ref.startsWith(selectedMonth))

    if (!filteredItems.length) {
      body.innerHTML = `<tr><td colspan="4" class="text-muted">Nenhum item neste mês.</td></tr>`
      return
    }

    for (const item of filteredItems) {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${item.month_ref.slice(0, 7)}</td>
        <td>${item.description}</td>
        <td>R$ ${parseFloat(item.value).toFixed(2)}</td>
        <td>${item.installment_now}</td>
        <td>${item.installment_max}</td>
        <td>
          <button class="btn btn-sm btn-link text-primary edit-item" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-link text-danger delete-item" data-id="${item.id}">Remover</button>
        </td>
      `
      body.appendChild(row)
    }

    // Botões de ação
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

  // Botão + Item
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


  // Aba de configurações
  import('./entityModal.js').then(({ showEntityModal }) => {
    const configDiv = modalEl.querySelector('#configContainer')
    const configBtn = document.createElement('button')
    configBtn.className = 'btn btn-warning btn-sm mb-3'
    configBtn.textContent = 'Editar Entidade'
    configBtn.onclick = () =>
      showEntityModal(entity, () => {
        modal.hide()
        if (onUpdate) onUpdate()
      })
    configDiv.appendChild(configBtn)

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
