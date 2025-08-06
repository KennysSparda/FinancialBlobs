// test/item.test.js

const axios = require('axios')

const BASE_URL = 'http://localhost:3001/api/v1/items'
const ENTITY_URL = 'http://localhost:3001/api/v1/entities'

describe('🧪 Testes API de Itens', () => {
  let entityId
  let itemId

  beforeAll(async () => {
    const res = await axios.post(ENTITY_URL, {
      name: 'Entidade Teste Itens',
      description: 'Entidade temporária para testar itens'
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
      await axios.post(BASE_URL, { name: '' })
    } catch (err) {
      expect(err.response.status).toBe(422)
    }
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
      installment_max: 3,
      month_ref: '2025-09-01'
    })

    expect(res.status).toBe(200)
  })

  test('Deve deletar o item', async () => {
    const res = await axios.delete(`${BASE_URL}/${itemId}`)
    expect(res.status).toBe(204)
  })

  test('Deve gerar 24 itens mensais se o item for recorrente', async () => {
    const startMonth = '2025-08-01'

    const res = await axios.post(BASE_URL, {
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

    const allItems = await axios.get(`${ENTITY_URL}/${entityId}/items`)
    const recurringItems = allItems.data.filter(i => i.description === 'Assinatura mensal')

    expect(recurringItems.length).toBe(24)
    const months = recurringItems.map(i => i.month_ref.slice(0, 7))
    const uniqueMonths = new Set(months)
    expect(uniqueMonths.size).toBe(24)
  })

  test('Deve gerar 3 itens mensais se for um item parcelado em 3x', async () => {
    const startMonth = '2025-08-01'

    const res = await axios.post(BASE_URL, {
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

    const allItems = await axios.get(`${ENTITY_URL}/${entityId}/items`)
    const parcelas = allItems.data.filter(i => i.description === 'Notebook parcelado')

    expect(parcelas.length).toBe(3)

    const months = parcelas.map(i => i.month_ref.slice(0, 7))
    expect(new Set(months).size).toBe(3)
  })

  test('Não deve duplicar itens se recorrentes já existirem nos próximos 24 meses', async () => {
    // Primeira vez cria 24
    await axios.post(BASE_URL, {
      entity_id: entityId,
      description: 'Plano de saúde',
      type: 'saida',
      value: 200,
      recurring: true,
      installment_now: 1,
      installment_max: 1,
      month_ref: '2025-08-01'
    })

    // Segunda vez tenta recriar
    await axios.post(BASE_URL, {
      entity_id: entityId,
      description: 'Plano de saúde',
      type: 'saida',
      value: 200,
      recurring: true,
      installment_now: 1,
      installment_max: 1,
      month_ref: '2025-08-01'
    })

    const allItems = await axios.get(`${ENTITY_URL}/${entityId}/items`)
    const recorrentes = allItems.data.filter(i => i.description === 'Plano de saúde')
    expect(recorrentes.length).toBe(24) // Não deve ser 48
  })

  test('Deve remover todas as parcelas de um item parcelado ao deletar uma delas', async () => {
    const startMonth = '2025-08-01'

    // Cria item parcelado em 5 vezes
    const res = await axios.post(BASE_URL, {
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

    // Deleta apenas a terceira parcela (índice 2)
    const parcelaId = createdIds[2]
    const deleteRes = await axios.delete(`${BASE_URL}/${parcelaId}`)
    expect(deleteRes.status).toBe(204)

    // Verifica se todas as parcelas sumiram
    const allItems = await axios.get(`${ENTITY_URL}/${entityId}/items`)
    const restantes = allItems.data.filter(i => i.description === 'Curso parcelado')
    expect(restantes.length).toBe(0)
    for (const id of createdIds) {
      try {
        await axios.get(`${BASE_URL}/${id}`)
        throw new Error('Item ainda existe: ' + id)
      } catch (err) {
        expect(err.response.status).toBe(404)
      }
    }

  })

})
