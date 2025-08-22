// src/ui/authModal.js

import { authAPI } from '../../api.js'
import { saveToken } from '../../auth.js'

let modalInstance = null
let modalEl = null

export function openAuthModal(onSuccess) {
  mountModal()
  const modal = new bootstrap.Modal(modalEl)
  modal.show()
  modalInstance = { modal, onSuccess }
}

function mountModal() {
  if (modalEl) return

  const wrapper = document.createElement('div')
  wrapper.innerHTML = `
    <div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">Entrar no FinancialBlobs</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <ul class="nav nav-tabs mb-3" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabLogin" type="button" role="tab">Login</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabRegister" type="button" role="tab">Registrar</button>
              </li>
            </ul>

            <div class="tab-content">
              <div class="tab-pane fade show active" id="tabLogin" role="tabpanel">
                <form id="formLogin" class="vstack gap-2">
                  <input class="form-control" type="email" name="email" placeholder="email" required />
                  <input class="form-control" type="password" name="password" placeholder="senha" required />
                  <button class="btn btn-primary" type="submit">Entrar</button>
                </form>
              </div>

              <div class="tab-pane fade" id="tabRegister" role="tabpanel">
                <form id="formRegister" class="vstack gap-2">
                  <input class="form-control" type="text" name="name" placeholder="nome" required />
                  <input class="form-control" type="email" name="email" placeholder="email" required />
                  <input class="form-control" type="password" name="password" placeholder="senha" required />
                  <button class="btn btn-success" type="submit">Criar conta</button>
                </form>
              </div>
            </div>

            <div class="mt-3 text-danger small d-none" id="authError"></div>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(wrapper.firstElementChild)
  modalEl = document.getElementById('authModal')

  // handlers
  modalEl.querySelector('#formLogin').addEventListener('submit', onSubmitLogin)
  modalEl.querySelector('#formRegister').addEventListener('submit', onSubmitRegister)
}

async function onSubmitLogin(e) {
  e.preventDefault()
  const fd = new FormData(e.currentTarget)
  const email = fd.get('email')
  const password = fd.get('password')

  try {
    const res = await authAPI.login({ email, password })
    saveToken(res.token)
    hideError()
    modalInstance.modal.hide()
    if (modalInstance.onSuccess) modalInstance.onSuccess()
  } catch (err) {
    showError(err.message)
  }
}

async function onSubmitRegister(e) {
  e.preventDefault()
  const fd = new FormData(e.currentTarget)
  const name = fd.get('name')
  const email = fd.get('email')
  const password = fd.get('password')

  try {
    const res = await authAPI.register({ name, email, password })
    saveToken(res.token)
    hideError()
    modalInstance.modal.hide()
    if (modalInstance.onSuccess) modalInstance.onSuccess()
  } catch (err) {
    showError(err.message)
  }
}

function showError(msg) {
  const el = modalEl.querySelector('#authError')
  el.textContent = msg
  el.classList.remove('d-none')
}

function hideError() {
  const el = modalEl.querySelector('#authError')
  el.textContent = ''
  el.classList.add('d-none')
}
