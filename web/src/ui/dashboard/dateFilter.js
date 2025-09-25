// /src/ui/dashboard/dateFilter.js
import { getDate } from './data.js'

export function initDateFilter({ mountEl, items, onChange }) {
  const state = { mode: 'month', ym: toYM(new Date()), startYM: null, endYM: null }
  const ymList = monthsFromItems(items)
  const lastYM = ymList[ymList.length - 1] || toYM(new Date())
  const actualYM = toYM(new Date())
  mountEl.innerHTML = `
    <div class="card">
      <div class="card-body d-flex flex-wrap align-items-center gap-3">
        <div class="btn-group" role="group" aria-label="Modo">
          <button type="button" class="btn btn-sm btn-primary" id="btnModeMonth">Mês</button>
          <button type="button" class="btn btn-sm btn-outline-primary" id="btnModeRange">Período</button>
        </div>

        <div class="d-flex align-items-center gap-2" id="blockMonth">
          <label class="form-label mb-0">Mês</label>
          <select id="selMonth" class="form-select form-select-sm" style="width:auto"></select>
          <button class="btn btn-sm btn-outline-secondary" id="btnClearMonth">Limpar</button>
        </div>

        <div class="d-flex align-items-center gap-2" id="blockRange">
          <label class="form-label mb-0">De</label>
          <select id="selStart" class="form-select form-select-sm" style="width:auto"></select>
          <label class="form-label mb-0">Até</label>
          <select id="selEnd" class="form-select form-select-sm" style="width:auto"></select>
          <button class="btn btn-sm btn-outline-secondary" id="btnClearRange">Limpar</button>
        </div>
      </div>
    </div>
  `

  const btnModeMonth = mountEl.querySelector('#btnModeMonth')
  const btnModeRange = mountEl.querySelector('#btnModeRange')
  const blockMonth = mountEl.querySelector('#blockMonth')
  const blockRange = mountEl.querySelector('#blockRange')
  const selMonth = mountEl.querySelector('#selMonth')
  const selStart = mountEl.querySelector('#selStart')
  const selEnd = mountEl.querySelector('#selEnd')

  fillMonthSelect(selMonth, ymList, actualYM)
  fillMonthSelect(selStart, ymList, ymList[0])
  fillMonthSelect(selEnd, ymList, lastYM)

  // inicia no modo "Mês" e já define o valor padrão
  state.mode = 'month'
  state.ym = actualYM
  blockMonth.classList.remove('d-none')
  blockRange.classList.add('d-none')
  emit()

  // alternância mês ↔ período
  btnModeMonth.onclick = () => {
    state.mode = 'month'
    btnModeMonth.classList.add('btn-primary')
    btnModeMonth.classList.remove('btn-outline-primary')
    btnModeRange.classList.remove('btn-primary')
    btnModeRange.classList.add('btn-outline-primary')
    blockMonth.classList.remove('d-none')
    blockRange.classList.add('d-none')
    emit()
  }

  btnModeRange.onclick = () => {
    state.mode = 'range'
    btnModeRange.classList.add('btn-primary')
    btnModeRange.classList.remove('btn-outline-primary')
    btnModeMonth.classList.remove('btn-primary')
    btnModeMonth.classList.add('btn-outline-primary')
    blockMonth.classList.add('d-none')
    blockRange.classList.remove('d-none')
    emit()
  }

  // eventos de valores
  selMonth.onchange = () => { state.ym = selMonth.value || null; emit() }
  selStart.onchange = () => { state.startYM = selStart.value || null; emit() }
  selEnd.onchange = () => { state.endYM = selEnd.value || null; emit() }

  mountEl.querySelector('#btnClearMonth').onclick = () => {
    selMonth.value = ''
    state.ym = null
    emit()
  }
  mountEl.querySelector('#btnClearRange').onclick = () => {
    selStart.value = ''
    selEnd.value = ''
    state.startYM = null
    state.endYM = null
    emit()
  }

  function emit() {
    if (typeof onChange !== 'function') return
    if (state.mode === 'month') onChange({ mode: 'month', ym: selMonth.value || null })
    else onChange({ mode: 'range', startYM: selStart.value || null, endYM: selEnd.value || null })
  }
}

/* helpers */
function monthsFromItems(items){
  const set = new Set()
  items.forEach(it=>{
    const d = getDate(it)
    if (d) set.add(toYM(d))
  })
  return [...set].sort()
}
function toYM(d){
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  return `${y}-${m}`
}
function fillMonthSelect(select, ymList, selectedYM){
  select.innerHTML = ''
  const blank = document.createElement('option')
  blank.value = ''
  blank.textContent = '—'
  select.appendChild(blank)
  ymList.forEach(ym=>{
    const [y,mm] = ym.split('-').map(Number)
    const label = new Date(y, mm-1, 1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
    const opt = document.createElement('option')
    opt.value = ym
    opt.textContent = label
    select.appendChild(opt)
  })
  if (selectedYM) select.value = selectedYM
}

export function ymToDateStart(ym){
  if (!ym) return null
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m-1, 1)
}
export function ymToDateEnd(ym){
  if (!ym) return null
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0, 23, 59, 59, 999)
}
