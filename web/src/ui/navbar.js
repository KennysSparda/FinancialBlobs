// src/ui/navbar.js

import { showEntityModal } from './modals/entityModal.js'
import { isAuthenticated, clearToken } from '../auth.js'
import { authAPI } from '../api.js'
import { openAuthModal } from './modals/authModal.js'

export async function renderNavbar({ onAddEntity, onAuthChanged }) {
  const existing = document.querySelector('nav.navbar')
  if (existing) existing.remove()

  const nav = document.createElement('nav')
  nav.className = 'navbar navbar-expand-lg navbar-dark bg-dark mb-4'

  const authArea = isAuthenticated()
    ? `<div class="d-flex gap-2 align-items-center">
         <span id="meName" class="navbar-text text-light small"></span>
         <button id="btnLogout" class="btn btn-outline-light btn-sm">Sair</button>
         <button id="btnAddEntity" class="btn btn-primary ms-2">Nova Entidade</button>
       </div>`
    : `<div class="d-flex gap-2">
         <button id="btnLogin" class="btn btn-success">Entrar / Registrar</button>
       </div>`

  nav.innerHTML = `
    <div class="container-fluid">
      <span class="navbar-brand">FinancialBlobs</span>
      ${authArea}
    </div>
  `

  document.body.prepend(nav)

  if (isAuthenticated()) {
    // carrega nome do usuário
    try {
      const me = await authAPI.me()
      const nameEl = nav.querySelector('#meName')
      if (nameEl) nameEl.textContent = me.name || me.email
    } catch {
      // se der erro, força login novamente
      if (onAuthChanged) onAuthChanged(false)
    }

    nav.querySelector('#btnLogout').addEventListener('click', () => {
      clearToken()
      if (onAuthChanged) onAuthChanged(false)
    })

    nav.querySelector('#btnAddEntity').addEventListener('click', () => {
      showEntityModal(null, () => {
        if (onAddEntity) onAddEntity()
      })
    })
  } else {
    nav.querySelector('#btnLogin').addEventListener('click', () => {
      openAuthModal(() => {
        if (onAuthChanged) onAuthChanged(true)
      })
    })
  }
}
