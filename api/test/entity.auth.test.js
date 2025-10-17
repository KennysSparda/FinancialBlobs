// test/entity.test.js

const axios = require('axios')

const API = 'http://localhost:3001/api/v1'
const AUTH = `${API}/auth`

// cria um cliente axios já com Authorization
async function makeAuthedClient() {
  const email = `entities+${Date.now()}@example.com`
  const password = '123456'

  await axios.post(`${AUTH}/register`, { name: 'Tester', email, password })
  const login = await axios.post(`${AUTH}/login`, { email, password })
  const token = login.data.token

  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  })
}

describe('🧪 Testes API de Entidades (com auth)', () => {
  let api
  let createdId

  beforeAll(async () => {
    api = await makeAuthedClient()
  })

  test('Deve criar uma entidade válida', async () => {
    const response = await api.post('/entities', {
      name: 'Cartão Nubank - Agosto/2025',
      description: 'Gastos Nubank mês de agosto'
    })

    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('id')
    createdId = response.data.id
  })

  test('Não deve criar entidade com dados inválidos', async () => {
    try {
      await api.post('/entities', { name: '' })
      throw new Error('esperava 422 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(422)
    }
  })

  test('Deve buscar todas as entidades', async () => {
    const response = await api.get('/entities')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    // quando listar, deve incluir status e paid_at
    if (response.data.length > 0) {
      const ent = response.data[0]
      expect(ent).toHaveProperty('status')
      expect(ent).toHaveProperty('paid_at')
    }
  })

  test('Deve buscar entidade por ID e conter status/paid_at', async () => {
    const response = await api.get(`/entities/${createdId}`)
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id', createdId)
    expect(response.data).toHaveProperty('status', 'aberta')
    expect(response.data).toHaveProperty('paid_at', null)
  })

  // ====== NOVOS TESTES DE ESTADO ======

  test('Deve marcar entidade como paga (status=paga, paid_at preenchido)', async () => {
    const payRes = await api.post(`/entities/${createdId}/pay`)
    expect(payRes.status).toBe(200)

    const getRes = await api.get(`/entities/${createdId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.data).toHaveProperty('status', 'paga')
    expect(getRes.data.paid_at).not.toBeNull()
  })

  test('Pay deve ser idempotente (segunda chamada mantém como paga)', async () => {
    const before = await api.get(`/entities/${createdId}`)
    const paidAtBefore = before.data.paid_at

    const payAgain = await api.post(`/entities/${createdId}/pay`)
    expect(payAgain.status).toBe(200)

    const after = await api.get(`/entities/${createdId}`)
    expect(after.data.status).toBe('paga')
    expect(after.data.paid_at).toBeTruthy()
    // não exigimos igualdade exata por formato de data, mas garante que continua preenchido
    // se quiser exigir "não mudou", compare strings:
    // expect(after.data.paid_at).toBe(paidAtBefore)
  })

  test('Deve reabrir entidade (status=aberta, paid_at=null)', async () => {
    const reopen = await api.post(`/entities/${createdId}/reopen`)
    expect(reopen.status).toBe(200)

    const getRes = await api.get(`/entities/${createdId}`)
    expect(getRes.data.status).toBe('aberta')
    expect(getRes.data.paid_at).toBeNull()
  })

  test('Deve cancelar entidade (status=cancelada, paid_at=null)', async () => {
    const cancel = await api.post(`/entities/${createdId}/cancel`)
    expect(cancel.status).toBe(200)

    const getRes = await api.get(`/entities/${createdId}`)
    expect(getRes.data.status).toBe('cancelada')
    expect(getRes.data.paid_at).toBeNull()
  })

  test('Progresso deve existir e iniciar zerado (sem itens)', async () => {
    const progress = await api.get(`/entities/${createdId}/progress`)
    expect(progress.status).toBe(200)
    expect(progress.data).toHaveProperty('entity_id', createdId)
    expect(progress.data).toHaveProperty('status')
    expect(progress.data).toHaveProperty('paid_at')
    expect(progress.data).toHaveProperty('items_total')
    expect(progress.data).toHaveProperty('items_pagos')
    expect(progress.data).toHaveProperty('pct_pago')

    expect(progress.data.items_total).toBe(0)
    expect(progress.data.items_pagos).toBe(0)
    expect(Number(progress.data.pct_pago)).toBe(0)
  })

  test('Endpoint pay-all-items deve responder 200 mesmo sem itens', async () => {
    const res = await api.post(`/entities/${createdId}/pay-all-items`)
    expect(res.status).toBe(200)

    // progresso permanece 0% se não existirem itens
    const progress = await api.get(`/entities/${createdId}/progress`)
    expect(progress.data.items_total).toBe(0)
    expect(progress.data.items_pagos).toBe(0)
    expect(Number(progress.data.pct_pago)).toBe(0)
  })

  // ====== CRUD FINAL ======

  test('Deve atualizar a entidade', async () => {
    const response = await api.put(`/entities/${createdId}`, {
      name: 'Cartão Nubank Editado - Agosto/2025',
      description: 'Atualizado'
    })
    expect(response.status).toBe(200)

    const getRes = await api.get(`/entities/${createdId}`)
    expect(getRes.data.name).toBe('Cartão Nubank Editado - Agosto/2025')
    expect(getRes.data.description).toBe('Atualizado')
  })

  test('Deve retornar 404 para entidade inexistente', async () => {
    try {
      await api.get('/entities/999999')
      throw new Error('esperava 404 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })

  test('Deve deletar a entidade', async () => {
    const response = await api.delete(`/entities/${createdId}`)
    expect(response.status).toBe(204)
  })

  test('Deve retornar 404 ao buscar entidade deletada', async () => {
    try {
      await api.get(`/entities/${createdId}`)
      throw new Error('esperava 404 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })
})
