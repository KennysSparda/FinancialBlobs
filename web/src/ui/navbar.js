import { showEntityModal } from './modals/entityModal.js'
import { isAuthenticated, clearToken } from '../auth.js'
import { authAPI } from '../api.js'
import { openAuthModal } from './modals/authModal.js'
import { getThemeMode, setThemeMode } from '../theme.js'

export async function renderNavbar({ onAddEntity, onAuthChanged }) {
  const existing = document.querySelector('nav.fb-navbar')
  if (existing) existing.remove()

  const mode = getThemeMode()
  const nav = document.createElement('nav')
  nav.className = 'fb-navbar navbar w-100 mb-3'

  const searchHTML = `
    <div class="fb-searchbox">
      <span class="fb-search-icon">🔎</span>
      <input id="fbSearch" class="form-control fb-search" placeholder="Pesquisar" />
    </div>
  `

  if (isAuthenticated()) {
    nav.innerHTML = `
      <div class="container-fluid">
        <a href="#" class="navbar-brand fb-nav__brand">FinancialBlobs</a>

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
      const nameEl = nav.querySelector('#meName')
      if (nameEl) nameEl.textContent = me.name || me.email
    } catch {
      onAuthChanged && onAuthChanged(false)
    }

    nav.querySelector('#ddAddEntity').addEventListener('click', () => {
      showEntityModal(null, () => onAddEntity && onAddEntity())
    })

    nav.querySelector('#ddLogout').addEventListener('click', () => {
      clearToken()
      onAuthChanged && onAuthChanged(false)
    })
  } else {
    nav.innerHTML = `
      <div class="container-fluid">
        <a href="#" class="navbar-brand fb-nav__brand">FinancialBlobs</a>

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

    nav.querySelector('#ddLogin').addEventListener('click', () => {
      openAuthModal(() => onAuthChanged && onAuthChanged(true))
    })
    // marcar rota ativa (sempre que hash mudar)
    function updateActive() {
      const hash = location.hash || '#/'
      const btnTable = nav.querySelector('#btnTable')
      const btnDash = nav.querySelector('#btnDashboard')
      if (!btnTable || !btnDash) return

      // reset
      btnTable.classList.remove('btn-primary')
      btnDash.classList.remove('btn-primary')
      btnTable.removeAttribute('disabled')
      btnDash.removeAttribute('disabled')

      if (hash.startsWith('#/dashboard')) {
        btnDash.classList.add('btn-primary')
        btnDash.setAttribute('disabled', 'true')
      } else {
        btnTable.classList.add('btn-primary')
        btnTable.setAttribute('disabled', 'true')
      }
    }

    updateActive()
    window.addEventListener('hashchange', updateActive)
    window.addEventListener('fb:nav:update', updateActive)


  }

  // tema
  nav.querySelectorAll('.fb-theme-segment .seg').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mode
      setThemeMode(m)
      nav.querySelectorAll('.fb-theme-segment .seg').forEach(b => b.classList.toggle('active', b === btn))
    })
  })

  // busca: por enquanto só loga, mas no dashboard podemos usar como filtro rápido
  const input = nav.querySelector('#fbSearch')
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim()
        // gancho: se estiver no dashboard, dispara um evento para filtrar os gráficos
        if (location.hash.startsWith('#/dashboard')) {
          const ev = new CustomEvent('fb:dash:search', { detail: { q } })
          window.dispatchEvent(ev)
        } else {
          console.log('buscar:', q)
        }
      }
    })
  }
}
