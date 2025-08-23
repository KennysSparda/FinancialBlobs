// /src/ui/dashboard/index.js
import { buildKinds, buildThisMonth, buildTimeline, computeByEntity } from './builders.js'
import { renderDoughnut, renderBar, renderLine } from './charts.js'
import { loadData, getDate, isIncome, getAmount } from './data.js'

export async function renderDashboard() {
  const main = document.getElementById('app')
  main.innerHTML = `
    <div class="container">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="mb-0">Dashboard</h2>
        <div class="text-muted" id="dashMeta">carregando...</div>
      </div>

      <!-- filtros -->
      <div class="row g-2 mb-3">
        <div class="col-12 col-lg-6">
          <div class="card">
            <div class="card-body d-flex align-items-center gap-2 flex-wrap">
              <strong class="me-2">Pesquisa simples</strong>
              <label class="form-label mb-0">Mês</label>
              <select id="selSimple" class="form-select form-select-sm" style="width:auto"></select>
              <button id="btnClearSimple" class="btn btn-sm btn-outline-secondary">Limpar</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card">
            <div class="card-body d-flex align-items-center gap-2 flex-wrap">
              <strong class="me-2">Pesquisa avançada</strong>
              <label class="form-label mb-0">De</label>
              <select id="selStart" class="form-select form-select-sm" style="width:auto"></select>
              <label class="form-label mb-0">Até</label>
              <select id="selEnd" class="form-select form-select-sm" style="width:auto"></select>
              <button id="btnClearRange" class="btn btn-sm btn-outline-secondary">Limpar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- cards -->
      <div class="row g-3 mb-3" id="dashCards"></div>

      <!-- charts -->
      <div class="row g-3">
        <div class="col-12 col-lg-4"><div class="card h-100"><div class="card-body">
          <h5 class="card-title">Distribuição por Entidade</h5>
          <canvas id="chByEntity"></canvas>
        </div></div></div>

        <div class="col-12 col-lg-4"><div class="card h-100"><div class="card-body">
          <h5 class="card-title">Status / Tipo</h5>
          <canvas id="chKinds"></canvas>
        </div></div></div>

        <div class="col-12 col-lg-4"><div class="card h-100"><div class="card-body">
          <h5 class="card-title">Receitas vs Despesas (mês)</h5>
          <canvas id="chThisMonth"></canvas>
        </div></div></div>

        <div class="col-12"><div class="card"><div class="card-body">
          <h5 class="card-title">Evolução no Tempo (últimos 12 meses)</h5>
          <canvas id="chTimeline"></canvas>
        </div></div></div>
      </div>
    </div>
  `

  const { entities, items } = await loadData()
  main.querySelector('#dashMeta').textContent = `${entities.length} entidades • ${items.length} itens`

  // ==== meses disponíveis a partir dos itens ====
  const ymList = monthsFromItems(items)           // ['2024-03','2024-04',...]
  const lastYM = ymList[ymList.length - 1] || toYM(new Date())

  // preencher selects
  fillMonthSelect(main.querySelector('#selSimple'), ymList, lastYM)
  fillMonthSelect(main.querySelector('#selStart'), ymList, ymList[0])
  fillMonthSelect(main.querySelector('#selEnd'), ymList, lastYM)

  // render inicial
  const ch = {
    byEntity: document.getElementById('chByEntity'),
    kinds: document.getElementById('chKinds'),
    month: document.getElementById('chThisMonth'),
    timeline: document.getElementById('chTimeline')
  }

  renderAll(items)

  // eventos
  const selSimple = main.querySelector('#selSimple')
  const selStart = main.querySelector('#selStart')
  const selEnd = main.querySelector('#selEnd')
  main.querySelector('#btnClearSimple').onclick = () => { selSimple.value = ''; refresh() }
  main.querySelector('#btnClearRange').onclick = () => { selStart.value = ''; selEnd.value = ''; refresh() }
  selSimple.onchange = refresh
  selStart.onchange = refresh
  selEnd.onchange = refresh

  // busca da navbar vira filtro também
  window.addEventListener('fb:dash:search', e => {
    const q = (e.detail?.q ?? '').toLowerCase()
    const filtered = q ? items.filter(it => JSON.stringify(it).toLowerCase().includes(q)) : items
    renderAll(filtered)
  })

  function refresh() {
    // prioridade: se mês simples preenchido, ignora intervalo
    const simple = selSimple.value || null
    const start = selStart.value || null
    const end = selEnd.value || null

    let filtered = items

    if (simple) {
      filtered = items.filter(it => {
        const d = getDate(it)
        if (!d) return false
        return toYM(d) === simple
      })
      renderAll(filtered, { simpleYM: simple })
      return
    }

    if (start || end) {
      const startDate = start ? fromYM(start) : null
      const endDate = end ? endOfMonth(fromYM(end)) : null
      filtered = items.filter(it => {
        const d = getDate(it)
        if (!d) return false
        if (startDate && d < startDate) return false
        if (endDate && d > endDate) return false
        return true
      })
      renderAll(filtered)
      return
    }

    renderAll(items)
  }

  function renderAll(sourceItems, opts = {}) {
    // cards
    renderCards(sourceItems)

    // rosquinhas
    renderDoughnut(ch.byEntity, computeByEntity(entities, sourceItems))
    renderDoughnut(ch.kinds, buildKinds(sourceItems))

    // mês: se veio simpleYM usa ele, senão tenta último mês com dados na lista filtrada
    let monthArgs = {}
    if (opts.simpleYM) {
      const { y, m } = splitYM(opts.simpleYM)
      monthArgs = { year: y, month: m }
    } else {
      const list = monthsFromItems(sourceItems)
      const pick = list.length ? list[list.length - 1] : lastYM
      const { y, m } = splitYM(pick)
      monthArgs = { year: y, month: m }
    }
    renderBar(ch.month, buildThisMonth(sourceItems, monthArgs))

    // timeline sempre últimos 12 meses a partir de hoje, mas com dados filtrados
    renderLine(ch.timeline, buildTimeline(sourceItems, { monthsBack: 12 }))
  }
}

/* ===== cards ===== */
function renderCards(items) {
  const box = document.getElementById('dashCards')
  const receitas = items.filter(isIncome).reduce((s,it)=>s+Math.abs(getAmount(it)),0)
  const despesas = items.filter(it=>!isIncome(it)).reduce((s,it)=>s+Math.abs(getAmount(it)),0)
  const saldo = receitas - despesas
  const qtd = items.length

  box.innerHTML = `
    <div class="col-6 col-lg-3"><div class="card text-center">
      <div class="card-body">
        <div class="text-muted small">Receitas</div>
        <div class="fs-4 text-success">R$ ${receitas.toFixed(2)}</div>
      </div>
    </div></div>
    <div class="col-6 col-lg-3"><div class="card text-center">
      <div class="card-body">
        <div class="text-muted small">Despesas</div>
        <div class="fs-4 text-danger">R$ ${despesas.toFixed(2)}</div>
      </div>
    </div></div>
    <div class="col-6 col-lg-3"><div class="card text-center">
      <div class="card-body">
        <div class="text-muted small">Saldo</div>
        <div class="fs-4 ${saldo>=0?'text-success':'text-danger'}">R$ ${saldo.toFixed(2)}</div>
      </div>
    </div></div>
    <div class="col-6 col-lg-3"><div class="card text-center">
      <div class="card-body">
        <div class="text-muted small">Itens</div>
        <div class="fs-4">${qtd}</div>
      </div>
    </div></div>
  `
}

/* ===== utils de mês (YYYY-MM) ===== */
function monthsFromItems(items){
  const set = new Set()
  items.forEach(it=>{
    const d = getDate(it)
    if (!d) return
    set.add(toYM(d))
  })
  return [...set].sort()
}

function toYM(d){
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  return `${y}-${m}`
}

function fromYM(ym){
  const { y, m } = splitYM(ym)
  return new Date(y, m, 1)
}

function endOfMonth(d){
  return new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59, 999)
}

function splitYM(ym){
  const [y, mm] = ym.split('-').map(Number)
  return { y, m: mm - 1 }
}

function monthLabel(ym){
  const { y, m } = splitYM(ym)
  return new Date(y, m, 1).toLocaleDateString('pt-BR',{ month:'long', year:'numeric' })
}

function fillMonthSelect(select, ymList, selectedYM){
  select.innerHTML = ''
  const blank = document.createElement('option')
  blank.value = ''
  blank.textContent = '—'
  select.appendChild(blank)

  ymList.forEach(ym=>{
    const opt = document.createElement('option')
    opt.value = ym
    opt.textContent = monthLabel(ym)
    select.appendChild(opt)
  })

  if (selectedYM) select.value = selectedYM
}
