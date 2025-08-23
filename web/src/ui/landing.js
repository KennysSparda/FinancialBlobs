import { openAuthModal } from './modals/authModal.js'

const heroImagesDefault = [
  'assets/img/landing/hero-1.jpg',
  'assets/img/landing/hero-2.jpg',
  'assets/img/landing/hero-3.jpg'
]

const modalImagesDefault = [
  { src: 'assets/img/landing/modal-1.png', cap: 'Criar/editar entidade' },
  { src: 'assets/img/landing/modal-2.png', cap: 'Adicionar itens (recorrente/parcelado)' },
  { src: 'assets/img/landing/modal-3.png', cap: 'Detalhar e filtrar itens por mês' },
  { src: 'assets/img/landing/modal-4.png', cap: 'Gerar próximos meses sem duplicar' }
]

export function renderLanding({ heroImages = heroImagesDefault, modals = modalImagesDefault } = {}) {
  const root = document.getElementById('entityTable')
  if (!root) return

  root.innerHTML = `
    <section class="fb-landing">

      <div class="fb-landing-hero">
        <div class="hero-bg">
          ${heroImages.map(src => `<img src="${src}" alt="Prévia do dashboard (borrado)">`).join('')}
        </div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div>
            <h1>Gerencie suas finanças mês a mês</h1>
            <p>Entidades, itens de entrada/saída, recorrência e parcelas com geração automática para os próximos meses — tudo em um painel rápido e elegante.</p>
          </div>
        </div>
      </div>

      <section class="fb-steps">
        <div class="row g-2">
          <div class="col-12 col-md-4">
            <div class="step">
              <div class="k">1</div>
              <strong>Crie suas entidades</strong>
              <span class="text-muted">Cartões, contas, salários, cofres — personalize como quiser.</span>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="step">
              <div class="k">2</div>
              <strong>Adicione itens</strong>
              <span class="text-muted">Entrada ou saída, recorrente por 24 meses ou parcelado (n de parcelas).</span>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="step">
              <div class="k">3</div>
              <strong>Acompanhe por mês</strong>
              <span class="text-muted">Totais, saldo final e visual limpo — sem duplicar lançamentos.</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="fb-gallery">
          ${modals.map(m => `
            <figure class="fb-shot">
              <img src="${m.src}" alt="${m.cap}">
              <figcaption class="cap">${m.cap}</figcaption>
            </figure>
          `).join('')}
        </div>
      </section>

      <section class="fb-cta">
        <h3>Pronto pra testar?</h3>
        <p class="text-muted">Crie sua conta e comece a organizar as finanças agora.</p>
        <div>
          <button id="btnStart" class="btn btn-primary">Começar agora</button>
        </div>
      </section>

    </section>
  `

  const start = document.getElementById('btnStart')
  if (start) {
    start.addEventListener('click', () => {
      openAuthModal()
    })
  }
}
