import { entityAPI, itemAPI } from '../../../api.js'
import { pickScope } from '../scopePicker.js'
import { monthLabel } from '../../../utils/date.js'

export function initItemsSection({ modalEl, entity, onUpdate }) {
  const monthSelector = modalEl.querySelector('#monthSelector')
  const body = modalEl.querySelector('#itemsTableBody')
  const addItemBtn = modalEl.querySelector('#addItemBtn')

  let freshItems = []

  const ensureItems = async () => {
    if (freshItems.length) return freshItems
    freshItems = await entityAPI.getItems(entity.id)
    return freshItems
  }

  const renderMonthOptions = items => {
    const previousSelectedMonth = monthSelector.value
    monthSelector.innerHTML = ''
    const unique = [...new Set(items.map(i => i.month_ref.slice(0, 7)))].sort()
    for (const month of unique) {
      const opt = document.createElement('option')
      opt.value = month

      opt.textContent = monthLabel(month)

      monthSelector.appendChild(opt)
    }
    if (previousSelectedMonth && unique.includes(previousSelectedMonth)) {
      monthSelector.value = previousSelectedMonth
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7)
      monthSelector.value = unique.includes(currentMonth) ? currentMonth : unique[0]
    }
  }

  const renderRows = items => {
    const selectedMonth = monthSelector.value || ''
    const filtered = items
      .filter(i => i.month_ref.startsWith(selectedMonth))
      .sort((a, b) => {
        if (a.installment_max > 1 && b.installment_max <= 1) return -1
        if (a.installment_max <= 1 && b.installment_max > 1) return 1
        return 0
      })

    body.innerHTML = ''

    if (!filtered.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-muted">Nenhum item neste mês.</td></tr>`
      return
    }

    for (const item of filtered) {
      const row = document.createElement('tr')
      const color = item.type === 'entrada' ? 'var(--fb-success)' : 'var(--fb-danger)'
      row.innerHTML = `
        <td>${item.month_ref.slice(0, 7)}</td>
        <td>${item.description}</td>
        <td>
          <span class="currency" style="color:${color}">
            <span class="currency__symbol" aria-hidden="true">R$</span>
            <span class="currency__amount">
              ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </td>
        <td>${item.installment_now}</td>
        <td>${item.installment_max}</td>
        <td>
          <button class="btn btn-sm btn-link text-primary edit-item" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-link text-danger delete-item" data-id="${item.id}">Remover</button>
        </td>
      `
      body.appendChild(row)
    }

    // editar
    body.querySelectorAll('.edit-item').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.dataset.id
        const item = freshItems.find(i => i.id == itemId)
        import('../itemModal.js').then(({ showItemModal }) =>
          showItemModal({
            item,
            onSave: () => {
              resetCache()
              refresh()
              if (onUpdate) onUpdate()
            }
          })
        )
      }
    })

    // remover
    body.querySelectorAll('.delete-item').forEach(btn => {
      btn.onclick = async () => {
        const itemId = btn.dataset.id
        const item = freshItems.find(i => i.id == itemId)
        if (!item) return
        try {
          let opts = undefined
          const isSeries = item.recurring || (item.installment_max > 1)
          if (isSeries) {
            const choice = await pickScope({ mode: 'delete', defaultScope: 'forward' })
            if (choice === null) return
            opts = { scope: choice }
          } else {
            const ok = confirm('Remover item?')
            if (!ok) return
          }
          await itemAPI.remove(itemId, opts)
          resetCache()
          await refresh()
          if (onUpdate) onUpdate()
        } catch (err) {
          alert(`Erro ao remover item: ${err.message}`)
        }
      }
    })
  }

  const refresh = async () => {
    const items = await ensureItems()
    if (!monthSelector.options.length) renderMonthOptions(items)
    renderRows(items)
  }

  const resetCache = () => {
    freshItems = []
  }

  // eventos
  monthSelector.addEventListener('change', refresh)

  addItemBtn.addEventListener('click', () => {
    const selectedMonth = monthSelector.value
    import('../itemModal.js').then(({ showItemModal }) =>
      showItemModal({
        entityId: entity.id,
        defaultMonthRef: selectedMonth,
        onSave: () => {
          resetCache()
          refresh()
          if (onUpdate) onUpdate()
        }
      })
    )
  })

  // primeira renderização
  refresh()

  return {
    refresh,
    resetCache,
    async getItems() {
      return ensureItems()
    },
    getSelectedMonth() {
      return monthSelector.value
    }
  }
}
