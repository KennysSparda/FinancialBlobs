export function renderNavbar({ onAddEntity }) {
  const nav = document.createElement('nav')
  nav.className = 'navbar navbar-expand-lg navbar-light bg-light mb-4'

  nav.innerHTML = `
    <div class="container-fluid">
      <span class="navbar-brand">Gerenciador Financeiro</span>
      <div class="d-flex">
        <select id="entitySelect" class="form-select me-2"></select>
        <button id="btnAddEntity" class="btn btn-primary">Nova Entidade</button>
      </div>
    </div>
  `

  // Eventos
  if (typeof onAddEntity === 'function') {
    nav.querySelector('#btnAddEntity').addEventListener('click', onAddEntity)
  }

  // Adiciona a navbar no início do body
  document.body.prepend(nav)
}
