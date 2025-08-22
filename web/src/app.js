// src/app.js
import { renderNavbar } from './ui/navbar.js'
import { renderEntityTable } from './ui/renderEntityTable.js'
import { isAuthenticated } from './auth.js'
import { openAuthModal } from './ui/modals/authModal.js'

async function handleAuthChanged(loggedIn) {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
  if (loggedIn) {
    refresh()
  } else {
    clearContent()
  }
}

async function boot() {
  await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })

  if (!isAuthenticated()) {
    openAuthModal(async () => {
      await renderNavbar({ onAddEntity: refresh, onAuthChanged: handleAuthChanged })
      refresh()
    })
    return
  }

  refresh()
}

function clearContent() {
  const table = document.getElementById('entityTable')
  if (table) table.innerHTML = '<div class="text-muted">Faça login para visualizar suas entidades</div>'
}

function refresh() {
  renderEntityTable()
}

boot()
