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

async function boot() {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (!isAuthenticated()) {
    renderLanding()
    return
  }
  window.addEventListener('hashchange', route)
  route()
}

function route() {
  const main = document.getElementById('app')
  if (main) main.innerHTML = ''

  const hash = location.hash || '#/'
  if (hash.startsWith('#/dashboard')) {
    renderDashboard()
    toggleSearch(false)
  } else {
    renderEntityTable()
    toggleSearch(false)
  }

  window.dispatchEvent(new CustomEvent('fb:nav:update'))
}

function toggleSearch(visible) {
  const el = document.querySelector('.fb-searchbox')
  if (el) el.style.display = visible ? '' : 'none'
}

function refresh() {
  if (!isAuthenticated()) {
    renderLanding()
    return
  }
  route()
}

boot()
