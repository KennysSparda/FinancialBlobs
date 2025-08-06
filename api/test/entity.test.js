// test/entity.test.js

const axios = require('axios')

const BASE_URL = 'http://localhost:3001/api/v1/entities'

describe('🧪 Testes API de Entidades', () => {
  let createdId

  test('Deve criar uma entidade válida', async () => {
    const response = await axios.post(BASE_URL, {
      name: 'Cartão Nubank - Agosto/2025',
      description: 'Gastos Nubank mês de agosto'
    })

    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('id')
    createdId = response.data.id
  })

  test('Não deve criar entidade com dados inválidos', async () => {
    try {
      await axios.post(BASE_URL, { name: '' })
    } catch (err) {
      expect(err.response.status).toBe(422)
    }
  })

  test('Deve buscar todas as entidades', async () => {
    const response = await axios.get(BASE_URL)
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
  })

  test('Deve buscar entidade por ID', async () => {
    const response = await axios.get(`${BASE_URL}/${createdId}`)
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id', createdId)
  })

  test('Deve retornar 404 para entidade inexistente', async () => {
    try {
      await axios.get(`${BASE_URL}/999999`)
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })

  test('Deve atualizar a entidade', async () => {
    const response = await axios.put(`${BASE_URL}/${createdId}`, {
      name: 'Cartão Nubank Editado - Agosto/2025',
      description: 'Atualizado'
    })
    expect(response.status).toBe(200)
  })

  test('Deve deletar a entidade', async () => {
    const response = await axios.delete(`${BASE_URL}/${createdId}`)
    expect(response.status).toBe(204)
  })

  test('Deve retornar 404 ao buscar entidade inexistente', async () => {
    try {
      await axios.get(`${BASE_URL}/${createdId}`)
    } catch (err) {
      expect(err.response.status).toBe(404)
    }
  })

})
