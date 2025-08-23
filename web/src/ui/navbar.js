import { showEntityModal } from './modals/entityModal.js'
import { isAuthenticated, clearToken } from '../auth.js'
import { authAPI } from '../api.js'
import { openAuthModal } from './modals/authModal.js'
import { getThemeMode, setThemeMode, applyTheme, resolveTheme } from '../theme.js'

export async function renderNavbar({ onAddEntity, onAuthChanged }) {
  const existing = document.querySelector('nav.fb-navbar')
  if (existing) existing.remove()

  const mode = getThemeMode()
  const nav = document.createElement('nav')
  nav.className = 'fb-navbar navbar w-100 mb-3'

  // busca central
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

        ${searchHTML}

        <div class="fb-nav__actions">
          <!-- Botão de menu mais chamativo -->
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

    // identidade
    try {
      const me = await authAPI.me()
      const nameEl = nav.querySelector('#meName')
      if (nameEl) nameEl.textContent = me.name || me.email
    } catch {
      onAuthChanged && onAuthChanged(false)
    }

    // nova entidade
    nav.querySelector('#ddAddEntity').addEventListener('click', () => {
      showEntityModal(null, () => onAddEntity && onAddEntity())
    })

    // sair
    nav.querySelector('#ddLogout').addEventListener('click', () => {
      clearToken()
      onAuthChanged && onAuthChanged(false)
    })
  } else {
    nav.innerHTML = `
      <div class="container-fluid">
        <a href="#" class="navbar-brand fb-nav__brand">FinancialBlobs</a>

        ${searchHTML}

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
  }

  // switch de tema (🌙 / Auto / ☀️)
  nav.querySelectorAll('.fb-theme-segment .seg').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mode
      setThemeMode(m)
      // atualiza marcação ativa imediatamente
      nav.querySelectorAll('.fb-theme-segment .seg').forEach(b => b.classList.toggle('active', b === btn))
    })
  })

  // busca: placeholder por enquanto
  const input = nav.querySelector('#fbSearch')
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        // no futuro: chamar um searchAPI
        console.log('buscar:', e.target.value.trim())
      }
    })
  }
}
