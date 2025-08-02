// test/item.test.js

const axios = require('axios')

const BASE_URL = 'http://localhost:3001/api/v1/items'
const ENTITY_URL = 'http://localhost:3001/api/v1/entities'

describe('🧪 Testes API de Itens Financeiros', () => {
  let entityId
  let itemId

  beforeAll(async () => {
    const res = await axios.post(ENTITY_URL, {
      name: 'Entidade Teste Itens',
      description: 'Entidade temporária para testar itens',
      month_ref: '2025-08-01'
    })
    entityId = res.data.id
  })

  afterAll(async () => {
    if (entityId) await axios.delete(`${ENTITY_URL}/${entityId}`)
  })

  test('Deve criar um item vinculado à entidade', async () => {
    const res = await axios.post(BASE_URL, {
      entity_id: entityId,
      description: 'Compra de supermercado',
      type: 'saida',
      value: 150.75,
      recurring: false,
      installment_now: 1,
      installment_max: 3
    })

    expect(res.status).toBe(201)
    expect(res.data).toHaveProperty('id')
    itemId = res.data.id
  })

  test('Deve listar todos os itens', async () => {
    const res = await axios.get(BASE_URL)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
  })

  test('Deve buscar o item recém-criado', async () => {
    const res = await axios.get(`${BASE_URL}/${itemId}`)
    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('id', itemId)
  })

  test('Deve buscar itens da entidade pelo ID', async () => {
    const res = await axios.get(`${ENTITY_URL}/${entityId}/items`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data.some(item => item.id === itemId)).toBe(true)
  })

  test('Deve atualizar o item', async () => {
    const res = await axios.put(`${BASE_URL}/${itemId}`, {
      description: 'Compra no mercado atualizada',
      type: 'saida',
      value: 175.99,
      recurring: true,
      installment_now: 2,
      installment_max: 3
    })

    expect(res.status).toBe(200)
  })

  test('Deve deletar o item', async () => {
    const res = await axios.delete(`${BASE_URL}/${itemId}`)
    expect(res.status).toBe(204)
  })
})
