// src/app.js
import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'
import { isAuthenticated } from './auth.js'
import { openAuthModal } from './ui/modals/authModal.js'
import { applyTheme } from './theme.js'
import { renderLanding } from './ui/landing.js'

applyTheme()

async function handleAuthChanged(loggedIn) {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (loggedIn) {
    refresh()
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

  refresh()
}

function refresh() {
  renderEntityTable()
}

boot()
