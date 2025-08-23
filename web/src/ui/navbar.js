// src/ui/navbar.js
import { showEntityModal } from './modals/entityModal.js'
import { isAuthenticated, clearToken } from '../auth.js'
import { authAPI } from '../api.js'
import { openAuthModal } from './modals/authModal.js'
import { getTheme, toggleTheme } from '../theme.js'

export async function renderNavbar({ onAddEntity, onAuthChanged }) {
  const existing = document.querySelector('nav.navbar')
  if (existing) existing.remove()

  const nav = document.createElement('nav')
  const theme = getTheme()
  const navTone = theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'
  nav.className = `navbar navbar-expand-lg ${navTone} mb-4 py-1 fs-6`

  const themeBtn = `
    <button id="btnTheme" class="btn btn-outline-secondary btn-sm" title="Alternar tema">
      ${theme === 'dark' ? '🌙' : '🌞'}
    </button>
  `

  const authArea = isAuthenticated()
    ? `<div class="d-flex gap-2 align-items-center">
         ${themeBtn}
         <span id="meName" class="navbar-text small"></span>
         <button id="btnLogout" class="btn btn-outline-secondary btn-sm">Sair</button>
         <button id="btnAddEntity" class="btn btn-primary ms-2">Nova Entidade</button>
       </div>`
    : `<div class="d-flex gap-2">
         ${themeBtn}
         <button id="btnLogin" class="btn btn-success">Entrar / Registrar</button>
       </div>`

  nav.innerHTML = `
    <div class="container-fluid">
      <span class="navbar-brand">FinancialBlobs</span>
      ${authArea}
    </div>
  `

  document.body.prepend(nav)

  // botão de tema
  nav.querySelector('#btnTheme').addEventListener('click', async () => {
    toggleTheme()
    // re-renderiza a navbar pra atualizar classes e ícone do botão
    await renderNavbar({ onAddEntity, onAuthChanged })
  })

  if (isAuthenticated()) {
    try {
      const me = await authAPI.me()
      const nameEl = nav.querySelector('#meName')
      if (nameEl) nameEl.textContent = me.name || me.email
    } catch {
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
