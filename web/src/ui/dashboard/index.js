import { buildKinds, buildThisMonth, buildTimeline, computeByEntity } from './builders.js'
import { renderDoughnut, renderBar, renderLine } from './charts.js'
import { loadData, getDate, isIncome, getAmount } from './data.js'
import { initDateFilter, ymToDateStart, ymToDateEnd } from './dateFilter.js'

export async function renderDashboard() {
  const main = document.getElementById('app')
  main.innerHTML = `
    <div class="container">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="mb-0">Dashboard</h2>
        <div class="text-muted" id="dashMeta">carregando...</div>
      </div>

      <div id="dateFilter" class="mb-3"></div>

      <div class="row g-3 mb-3" id="dashCards"></div>

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

  const els = {
    byEntity: document.getElementById('chByEntity'),
    kinds: document.getElementById('chKinds'),
    month: document.getElementById('chThisMonth'),
    timeline: document.getElementById('chTimeline'),
    cards: document.getElementById('dashCards')
  }

  const renderAll = (sourceItems, monthPref) => {
    renderCards(els.cards, sourceItems)

    renderDoughnut(els.byEntity, computeByEntity(entities, sourceItems))
    renderDoughnut(els.kinds, buildKinds(sourceItems))

    // mês: se monthPref informado usa ele, senão último mês com dados do conjunto
    let args = monthPref
    if (!args) {
      const list = sourceItems
        .map(getDate).filter(Boolean)
        .map(d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
        .sort()
      const pick = list[list.length - 1]
      if (pick) {
        const [y,m] = pick.split('-').map(Number)
        args = { year: y, month: m-1 }
      }
    }
    renderBar(els.month, buildThisMonth(sourceItems, args || {}))

    renderLine(els.timeline, buildTimeline(sourceItems, { monthsBack: 12 }))
  }

  renderAll(items)

  // componente de data
  initDateFilter({
    mountEl: document.getElementById('dateFilter'),
    items,
    onChange: ({ mode, ym, startYM, endYM }) => {
      let filtered = items
      let monthPref = null

      if (mode === 'month') {
        if (ym) {
          const start = ymToDateStart(ym)
          const end = ymToDateEnd(ym)
          filtered = items.filter(it => {
            const d = getDate(it)
            return d && d >= start && d <= end
          })
          const [y,m] = ym.split('-').map(Number)
          monthPref = { year: y, month: m-1 }
        }
      } else {
        const start = startYM ? ymToDateStart(startYM) : null
        const end = endYM ? ymToDateEnd(endYM) : null
        if (start || end) {
          filtered = items.filter(it => {
            const d = getDate(it)
            if (!d) return false
            if (start && d < start) return false
            if (end && d > end) return false
            return true
          })
        }
      }

      renderAll(filtered, monthPref)
    }
  })

  // busca global como filtro
  window.addEventListener('fb:dash:search', e => {
    const q = (e.detail?.q ?? '').toLowerCase()
    const filtered = q ? items.filter(it => JSON.stringify(it).toLowerCase().includes(q)) : items
    renderAll(filtered)
  })
}

function renderCards(container, items) {
  const receitas = items.filter(isIncome).reduce((s,it)=>s+Math.abs(getAmount(it)),0)
  const despesas = items.filter(it=>!isIncome(it)).reduce((s,it)=>s+Math.abs(getAmount(it)),0)
  const saldo = receitas - despesas
  const qtd = items.length

  container.innerHTML = `
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
