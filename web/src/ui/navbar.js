import { showEntityModal } from './modals/entityModal.js'

export function renderNavbar({ onAddEntity }) {
  const nav = document.createElement('nav')
  nav.className = 'navbar navbar-expand-lg navbar-light bg-light mb-4'

  nav.innerHTML = `
    <div class="container-fluid">
      <span class="navbar-brand">FinancialBlobs</span>
      <div class="d-flex">
        <button id="btnAddEntity" class="btn btn-primary">Nova Entidade</button>
      </div>
    </div>
  `

  document.body.prepend(nav)

  nav.querySelector('#btnAddEntity').addEventListener('click', () => {
    showEntityModal(null, () => {
      if (onAddEntity) onAddEntity()
    })
  })
}
