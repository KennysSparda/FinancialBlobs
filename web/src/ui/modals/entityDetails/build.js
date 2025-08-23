export function buildEntityDetailsModal(entity) {
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

  return {
    modalEl,
    get monthSelector() {
      return modalEl.querySelector('#monthSelector')
    },
    get itemsBody() {
      return modalEl.querySelector('#itemsTableBody')
    },
    get addItemBtn() {
      return modalEl.querySelector('#addItemBtn')
    },
    get configContainer() {
      return modalEl.querySelector('#configContainer')
    }
  }
}
