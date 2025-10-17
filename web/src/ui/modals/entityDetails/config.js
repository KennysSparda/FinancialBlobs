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

function statusBadge(status) {
  const map = { aberta: 'bg-secondary', paga: 'bg-success', cancelada: 'bg-danger' }
  const cls = map[status] || 'bg-secondary'
  return `<span class="badge ${cls}">${status || 'aberta'}</span>`
}

function fmtDate(dt) {
  if (!dt) return '-'
  try {
    const d = new Date(dt)
    return d.toLocaleString()
  } catch {
    return dt
  }
}

export function initConfigSection({ modalEl, entity, items, onUpdate, close }) {
  const configDiv = modalEl.querySelector('#configContainer')

  // ===== Bloco de Status / Progresso / Ações de pagamento =====
  const statusCard = document.createElement('div')
  statusCard.className = 'card mb-3'
  statusCard.innerHTML = `
    <div class="card-body">
      <div class="d-flex flex-wrap align-items-center gap-3">
        <div id="statusBadge">${statusBadge(entity.status)}</div>
        <small class="text-muted">Pago em: <span id="statusPaidAt">${fmtDate(entity.paid_at)}</span></small>
        <small class="text-muted ms-auto" id="statusProgress">Progresso: -</small>
      </div>
      <div class="mt-2 d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-sm btn-success" id="btnPay">Pagar</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" id="btnReopen">Reabrir</button>
        <button type="button" class="btn btn-sm btn-outline-danger" id="btnCancel">Cancelar</button>
      </div>
    </div>
  `
  configDiv.appendChild(statusCard)

  const $badge = statusCard.querySelector('#statusBadge')
  const $paidAt = statusCard.querySelector('#statusPaidAt')
  const $progress = statusCard.querySelector('#statusProgress')
  const $btnPay = statusCard.querySelector('#btnPay')
  const $btnReopen = statusCard.querySelector('#btnReopen')
  const $btnCancel = statusCard.querySelector('#btnCancel')

  const setBusy = busy => {
    ;[$btnPay, $btnReopen, $btnCancel].forEach(b => b && (b.disabled = !!busy))
  }

  const refreshStatus = async () => {
    try {
      const ent = await entityAPI.get(entity.id)
      const prog = await entityAPI.progress(entity.id).catch(() => null)

      $badge.innerHTML = statusBadge(ent.status)
      $paidAt.textContent = fmtDate(ent.paid_at)
      if (prog) {
        const pct = Number(prog.pct_pago || 0)
        $progress.textContent = `Progresso: ${prog.items_pagos}/${prog.items_total} • ${pct.toFixed(0)}%`
      } else {
        $progress.textContent = 'Progresso: -'
      }

      // habilita/desabilita conforme status
      if ($btnPay) $btnPay.disabled = ent.status === 'paga'
      if ($btnReopen) $btnReopen.disabled = ent.status === 'aberta'
      if ($btnCancel) $btnCancel.disabled = ent.status === 'cancelada'
    } catch (err) {
      console.error('refreshStatus', err)
    }
  }

  $btnPay.onclick = async () => {
    try {
      setBusy(true)
      await entityAPI.pay(entity.id)
      await refreshStatus()
      if (onUpdate) onUpdate()
    } catch (err) {
      alert(`Falha ao pagar: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  $btnReopen.onclick = async () => {
    try {
      setBusy(true)
      await entityAPI.reopen(entity.id)
      await refreshStatus()
      if (onUpdate) onUpdate()
    } catch (err) {
      alert(`Falha ao reabrir: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  $btnCancel.onclick = async () => {
    try {
      setBusy(true)
      await entityAPI.cancel(entity.id)
      await refreshStatus()
      if (onUpdate) onUpdate()
    } catch (err) {
      alert(`Falha ao cancelar: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  // carrega status inicial
  refreshStatus()

  // ===== Barra de ações (como você já tinha) =====
  const actionBar = makeActionBar()
  configDiv.appendChild(actionBar)

  // -- Grupo esquerdo: Editar entidade
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

  // -- Grupo central: ações de limpeza
  const centerGroup = document.createElement('div')
  centerGroup.className = 'd-flex flex-wrap align-items-center gap-2'
  actionBar.appendChild(centerGroup)

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

  // -- Grupo direito: Deletar entidade
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
