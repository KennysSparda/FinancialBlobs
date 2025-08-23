// src/ui/navbar.js
import { showEntityModal } from './modals/entityModal.js'
import { isAuthenticated, clearToken } from '../auth.js'
import { authAPI } from '../api.js'
import { openAuthModal } from './modals/authModal.js'
import { getThemeMode, setThemeMode } from '../theme.js'

export async function renderNavbar({ onAddEntity, onAuthChanged }) {
  document.querySelector('nav.fb-navbar')?.remove()

  const mode = getThemeMode()
  const nav = document.createElement('nav')
  nav.className = 'fb-navbar navbar w-100 mb-3'

  if (isAuthenticated()) {
    nav.innerHTML = `
      <div class="container-fluid">
        <a href="#/" class="navbar-brand fb-nav__brand">FinancialBlobs</a>

        <div class="fb-nav__routes d-flex gap-2">
          <a href="#/" class="btn btn-sm" id="btnTable">Tabela</a>
          <a href="#/dashboard" class="btn btn-sm" id="btnDashboard">Dashboard</a>
        </div>



        <div class="fb-nav__actions d-flex align-items-center gap-2">
          <div class="dropdown">
            <button class="btn fb-iconbtn fb-menu-btn is-primary" id="btnMenu" data-bs-toggle="dropdown" aria-expanded="false" title="Menu">≡</button>
            <ul class="dropdown-menu dropdown-menu-end fb-nav-dropdown">
              <li><h6 class="dropdown-header" id="meName">...</h6></li>
              <li><button class="dropdown-item" id="ddAddEntity">Nova Entidade</button></li>
              <li><hr class="dropdown-divider"></li>
              <li class="px-3 py-2">
                <div class="fb-theme-segment" role="group" aria-label="Tema">
                  <button class="seg ${mode==='dark' ? 'active' : ''}" data-mode="dark">🌙</button>
                  <button class="seg ${mode==='auto' ? 'active' : ''}" data-mode="auto">Auto</button>
                  <button class="seg ${mode==='light' ? 'active' : ''}" data-mode="light">☀️</button>
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" id="ddLogout">Sair</button></li>
            </ul>
          </div>
        </div>
      </div>
    `
    document.body.prepend(nav)

    try {
      const me = await authAPI.me()
      nav.querySelector('#meName').textContent = me.name || me.email
    } catch {
      onAuthChanged && onAuthChanged(false)
    }

    nav.querySelector('#ddAddEntity').onclick = () => {
      showEntityModal(null, () => onAddEntity && onAddEntity())
    }
    nav.querySelector('#ddLogout').onclick = () => {
      clearToken()
      onAuthChanged && onAuthChanged(false)
    }

  } else {
    nav.innerHTML = `
      <div class="container-fluid">
        <a href="#/" class="navbar-brand fb-nav__brand">FinancialBlobs</a>

        <div class="fb-nav__actions">
          <div class="dropdown">
            <button class="btn fb-iconbtn fb-menu-btn is-primary" id="btnMenu" data-bs-toggle="dropdown" aria-expanded="false" title="Menu">≡</button>
            <ul class="dropdown-menu dropdown-menu-end fb-nav-dropdown">
              <li class="px-3 py-2">
                <div class="fb-theme-segment" role="group" aria-label="Tema">
                  <button class="seg ${mode==='dark' ? 'active' : ''}" data-mode="dark">🌙</button>
                  <button class="seg ${mode==='auto' ? 'active' : ''}" data-mode="auto">Auto</button>
                  <button class="seg ${mode==='light' ? 'active' : ''}" data-mode="light">☀️</button>
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item" id="ddLogin">Entrar / Registrar</button></li>
            </ul>
          </div>
        </div>
      </div>
    `
    document.body.prepend(nav)
    nav.querySelector('#ddLogin').onclick = () => openAuthModal(() => onAuthChanged && onAuthChanged(true))
  }

  // tema
  nav.querySelectorAll('.fb-theme-segment .seg').forEach(btn => {
    btn.addEventListener('click', () => {
      setThemeMode(btn.dataset.mode)
      nav.querySelectorAll('.fb-theme-segment .seg').forEach(b => b.classList.toggle('active', b === btn))
    })
  })

  // marcar ativo
  const updateActive = () => {
    const btnTable = nav.querySelector('#btnTable')
    const btnDash = nav.querySelector('#btnDashboard')
    if (!btnTable || !btnDash) return
    const isDash = (location.hash || '#/').startsWith('#/dashboard')

    btnTable.classList.toggle('btn-primary', !isDash)
    btnDash.classList.toggle('btn-primary', isDash)
    if (isDash) {
      btnDash.setAttribute('disabled','true')
      btnTable.removeAttribute('disabled')
    } else {
      btnTable.setAttribute('disabled','true')
      btnDash.removeAttribute('disabled')
    }
  }
  updateActive()
  window.addEventListener('hashchange', updateActive)
  window.addEventListener('fb:nav:update', updateActive)

  // busca → filtro do dashboard, se estiver no dashboard
  nav.querySelector('#fbSearch')?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return
    const q = e.target.value.trim()
    if ((location.hash || '').startsWith('#/dashboard')) {
      window.dispatchEvent(new CustomEvent('fb:dash:search', { detail: { q } }))
    } else {
      console.log('buscar:', q)
    }
  })
}
