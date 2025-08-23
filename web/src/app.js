// src/app.js
import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'
import { isAuthenticated } from './auth.js'
import { renderDashboard } from './ui/dashboard/index.js'
import { applyTheme } from './theme.js'
import { renderLanding } from './ui/landing.js'

applyTheme()

async function handleAuthChanged(loggedIn) {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (loggedIn) refresh()
  else renderLanding()
}

function refresh() {
  if (!isAuthenticated()) {
    renderLanding()
    return
  }
  route()
}

function route() {
  const hash = location.hash || ''

  // sempre limpa o container antes
  const main = document.getElementById('app')
  if (main) main.innerHTML = ''

  if (hash.startsWith('#/dashboard')) {
    renderDashboard()
    toggleSearch(false)
  } else {
    renderEntityTable()
    toggleSearch(true)
  }

  // avisa a navbar pra atualizar ativo
  const ev = new CustomEvent('fb:nav:update')
  window.dispatchEvent(ev)
}

function toggleSearch(visible) {
  const el = document.querySelector('.fb-searchbox')
  if (el) el.style.display = visible ? '' : 'none'
}

async function boot() {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (!isAuthenticated()) {
    renderLanding()
    return
  }
  window.addEventListener('hashchange', route)
  route()
}

boot()
