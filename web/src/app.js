// src/app.js
import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'
import { isAuthenticated } from './auth.js'
import { renderDashboard } from './ui/dashboard/index.js'
import { applyTheme } from './theme.js'
import { renderLanding } from './ui/landing.js'

applyTheme()

let routerReady = false

async function handleAuthChanged(loggedIn) {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (loggedIn) {
    ensureRouter()
    route()
  } else {
    renderLanding()
  }
}

async function boot() {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })

  if (!isAuthenticated()) {
    renderLanding()
    return
  }

  ensureRouter()
  route()
}

function ensureRouter() {
  if (routerReady) return
  window.addEventListener('hashchange', route)
  routerReady = true
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
    toggleSearch(true)
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
  ensureRouter()
  route()
}

boot()
