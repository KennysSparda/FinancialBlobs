// /src/ui/modals/entityDetails/config.js
import { entityAPI } from '../../../api.js'
import { deleteMonthItems, deleteAllForEntity } from '../../../utils/bulkDelete.js'
import { monthLabel } from '../../../utils/date.js'

// fábrica de botões para manter padrão visual
function makeBtn({ label, classes = '', onClick }) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = classes
  btn.textContent = label
  if (onClick) btn.onclick = onClick
  return btn
}

// linha de ações com alinhamento correto (esq: editar, centro: limpezas, dir: deletar)
function makeActionBar() {
  const bar = document.createElement('div')
  bar.className = 'd-flex flex-wrap align-items-center justify-content-between gap-2 mb-3'
  return bar
}

export function initConfigSection({ modalEl, entity, items, onUpdate, close }) {
  const configDiv = modalEl.querySelector('#configContainer')

  // ===== Barra de ações =====
  const actionBar = makeActionBar()
  configDiv.appendChild(actionBar)

  // -- Grupo esquerdo: Editar entidade (mantém btn-warning sólido)
  const leftGroup = document.createElement('div')
  leftGroup.className = 'd-flex align-items-center gap-2'
  actionBar.appendChild(leftGroup)

  const editBtn = makeBtn({
    label: 'Editar Entidade',
    classes: 'btn btn-warning',
    onClick: () => {
      import('../entityModal.js').then(({ showEntityModal }) => {
        showEntityModal(entity, () => {
          if (typeof close === 'function') close()
          if (onUpdate) onUpdate()
        })
      })
    }
  })
  leftGroup.appendChild(editBtn)

  // -- Grupo central: ações de limpeza (danger sólido como antes)
  const centerGroup = document.createElement('div')
  centerGroup.className = 'd-flex flex-wrap align-items-center gap-2'
  actionBar.appendChild(centerGroup)

  // Limpar mês exibido
  const btnClearMonth = makeBtn({
    label: 'Limpar mês exibido',
    classes: 'btn btn-danger',
    onClick: async () => {
      try {
        const ym = items.getSelectedMonth()
        if (!ym) {
          alert('Selecione um mês na aba Itens antes de limpar')
          return
        }
        const all = await items.getItems()
        const toRemove = all.filter(i => String(i.month_ref).startsWith(ym)).length
        if (!toRemove) {
          alert('Nenhum item neste mês para remover')
          return
        }

        const ok = confirm(`Remover ${toRemove} item(ns) de ${monthLabel(ym)}?`)
        if (!ok) return

        btnClearMonth.disabled = true
        await deleteMonthItems(all, ym)
        items.resetCache()
        await items.refresh()
        if (onUpdate) onUpdate()
      } catch (err) {
        alert(`Falha ao limpar mês: ${err.message}`)
      } finally {
        btnClearMonth.disabled = false
      }
    }
  })
  centerGroup.appendChild(btnClearMonth)

  // Limpar todos os itens
  const btnClearAll = makeBtn({
    label: 'Limpar todos os itens',
    classes: 'btn btn-danger',
    onClick: async () => {
      try {
        const all = await items.getItems()
        if (!all.length) {
          alert('Esta entidade não possui itens')
          return
        }
        const ok = confirm(`Remover TODOS os ${all.length} item(ns) desta entidade? Esta ação não pode ser desfeita`)
        if (!ok) return

        btnClearAll.disabled = true
        await deleteAllForEntity(all)
        items.resetCache()
        await items.refresh()
        if (onUpdate) onUpdate()
      } catch (err) {
        alert(`Falha ao limpar todos: ${err.message}`)
      } finally {
        btnClearAll.disabled = false
      }
    }
  })
  centerGroup.appendChild(btnClearAll)

  // -- Grupo direito: Deletar entidade (grudado à direita pelo justify-content-between)
  if (entity?.id) {
    const rightGroup = document.createElement('div')
    rightGroup.className = 'd-flex align-items-center'
    actionBar.appendChild(rightGroup)

    const deleteBtn = makeBtn({
      label: 'Deletar Entidade',
      classes: 'btn btn-danger',
      onClick: async () => {
        if (confirm('Tem certeza que deseja deletar esta entidade?')) {
          await entityAPI.remove(entity.id)
          if (typeof close === 'function') close()
          if (onUpdate) onUpdate()
        }
      }
    })
    rightGroup.appendChild(deleteBtn)
  }
}
