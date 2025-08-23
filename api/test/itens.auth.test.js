// test/itens.test.js

const axios = require('axios')

const API = 'http://localhost:3001/api/v1'
const AUTH = `${API}/auth`

async function makeAuthedClient() {
  const email = `items+${Date.now()}@example.com`
  const password = '123456'
  await axios.post(`${AUTH}/register`, { name: 'Tester', email, password })
  const login = await axios.post(`${AUTH}/login`, { email, password })
  const token = login.data.token
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  })
}

describe('🧪 Testes API de Itens (com auth)', () => {
  let api
  let entityId
  let itemId

  beforeAll(async () => {
    api = await makeAuthedClient()
    const res = await api.post('/entities', {
      name: 'Entidade Teste Itens',
      description: 'Entidade temporária para testar itens'
    })
    entityId = res.data.id
  })

  afterAll(async () => {
    if (entityId) await api.delete(`/entities/${entityId}`)
  })

  test('Deve criar um item vinculado à entidade', async () => {
    const res = await api.post('/items', {
      entity_id: entityId,
      description: 'Compra de supermercado',
      type: 'saida',
      value: 150.75,
      recurring: false,
      installment_now: 1,
      installment_max: 3,
      month_ref: '2025-08-01'
    })

    expect(res.data).toHaveProperty('ids')
    expect(Array.isArray(res.data.ids)).toBe(true)
    expect(res.data.ids.length).toBeGreaterThan(0)
    itemId = res.data.ids[0]
  })

  test('Não deve criar item com dados inválidos', async () => {
    try {
      await api.post('/items', { name: '' })
      throw new Error('esperava 422 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(422)
    }
  })

  test('Deve listar todos os itens', async () => {
    const res = await api.get('/items')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
  })

  test('Deve buscar o item recém-criado', async () => {
    const res = await api.get(`/items/${itemId}`)
    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('id', itemId)
  })

  test('Deve buscar itens da entidade pelo ID', async () => {
    const res = await api.get(`/entities/${entityId}/items`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data.some(item => item.id === itemId)).toBe(true)
  })

  test('Deve atualizar o item', async () => {
    const res = await api.put(`/items/${itemId}`, {
      description: 'Compra no mercado atualizada',
      type: 'saida',
      value: 175.99,
      recurring: true,
      installment_now: 2,
      installment_max: 3,
      month_ref: '2025-09-01'
    })

    expect(res.status).toBe(200)
  })

  test('Deve deletar o item', async () => {
    const res = await api.delete(`/items/${itemId}`)
    expect(res.status).toBe(204)
  })

  test('Deve gerar 24 itens mensais se o item for recorrente', async () => {
    const startMonth = '2025-08-01'

    const res = await api.post('/items', {
      entity_id: entityId,
      description: 'Assinatura mensal',
      type: 'saida',
      value: 50,
      recurring: true,
      installment_now: 1,
      installment_max: 1,
      month_ref: startMonth
    })

    expect(res.status).toBe(201)

    const allItems = await api.get(`/entities/${entityId}/items`)
    const recurringItems = allItems.data.filter(i => i.description === 'Assinatura mensal')

    expect(recurringItems.length).toBe(24)
    const months = recurringItems.map(i => i.month_ref.slice(0, 7))
    const uniqueMonths = new Set(months)
    expect(uniqueMonths.size).toBe(24)
  })

  test('Deve gerar 3 itens mensais se for um item parcelado em 3x', async () => {
    const startMonth = '2025-08-01'

    const res = await api.post('/items', {
      entity_id: entityId,
      description: 'Notebook parcelado',
      type: 'saida',
      value: 3000,
      recurring: false,
      installment_now: 1,
      installment_max: 3,
      month_ref: startMonth
    })

    expect(res.status).toBe(201)

    const allItems = await api.get(`/entities/${entityId}/items`)
    const parcelas = allItems.data.filter(i => i.description === 'Notebook parcelado')

    expect(parcelas.length).toBe(3)

    const months = parcelas.map(i => i.month_ref.slice(0, 7))
    expect(new Set(months).size).toBe(3)
  })

  test('Não deve duplicar itens se recorrentes já existirem nos próximos 24 meses', async () => {
    await api.post('/items', {
      entity_id: entityId,
      description: 'Plano de saúde',
      type: 'saida',
      value: 200,
      recurring: true,
      installment_now: 1,
      installment_max: 1,
      month_ref: '2025-08-01'
    })




    try {
      await api.post('/items', {
        entity_id: entityId,
        description: 'Plano de saúde',
        type: 'saida',
        value: 200,
        recurring: true,
        installment_now: 1,
        installment_max: 1,
        month_ref: '2025-08-01'
      })
      throw new Error('esperava 409 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(409)
    }

    const allItems = await api.get(`/entities/${entityId}/items`)
    const recorrentes = allItems.data.filter(i => i.description === 'Plano de saúde')
    expect(recorrentes.length).toBe(24)

  })

  test('Deve remover todas as parcelas de um item parcelado ao deletar uma delas', async () => {
    const startMonth = '2025-08-01'

    const res = await api.post('/items', {
      entity_id: entityId,
      description: 'Curso parcelado',
      type: 'saida',
      value: 100,
      recurring: false,
      installment_now: 1,
      installment_max: 5,
      month_ref: startMonth
    })

    expect(res.status).toBe(201)
    const createdIds = res.data.ids
    expect(createdIds.length).toBe(5)

    const parcelaId = createdIds[2]
    const deleteRes = await api.delete(`/items/${parcelaId}`)
    expect(deleteRes.status).toBe(204)

    const allItems = await api.get(`/entities/${entityId}/items`)
    const restantes = allItems.data.filter(i => i.description === 'Curso parcelado')
    expect(restantes.length).toBe(0)
    for (const id of createdIds) {
      try {
        await api.get(`/items/${id}`)
        throw new Error('Item ainda existe: ' + id)
      } catch (err) {
        expect(err.response.status).toBe(404)
      }
    }
  })
})
