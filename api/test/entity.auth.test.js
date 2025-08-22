// test/entity.test.js

const axios = require('axios')

const API = 'http://localhost:3001/api/v1'
const AUTH = `${API}/auth`
const ENTITIES = `${API}/entities`

// cria um cliente axios já com Authorization
async function makeAuthedClient() {
  const email = `entities+${Date.now()}@example.com`
  const password = '123456'

  // registra (idempotente: se rodar 2x, o segundo pode falhar em 409; mas neste fluxo é 1x)
  await axios.post(`${AUTH}/register`, { name: 'Tester', email, password })

  // login
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
  })

  test('Deve buscar entidade por ID', async () => {
    const response = await api.get(`/entities/${createdId}`)
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id', createdId)
  })

  test('Deve retornar 404 para entidade inexistente', async () => {
    try {
      await api.get('/entities/999999')
      throw new Error('esperava 404 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })

  test('Deve atualizar a entidade', async () => {
    const response = await api.put(`/entities/${createdId}`, {
      name: 'Cartão Nubank Editado - Agosto/2025',
      description: 'Atualizado'
    })
    expect(response.status).toBe(200)
  })

  test('Deve deletar a entidade', async () => {
    const response = await api.delete(`/entities/${createdId}`)
    expect(response.status).toBe(204)
  })

  test('Deve retornar 404 ao buscar entidade inexistente', async () => {
    try {
      await api.get(`/entities/${createdId}`)
      throw new Error('esperava 404 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })
})
