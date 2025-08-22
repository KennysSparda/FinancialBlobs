// test/auth.test.js

const axios = require('axios')

const API = 'http://localhost:3001/api/v1'
const AUTH = `${API}/auth`

// helper pra criar um cliente com Authorization
const clientWithToken = token =>
  axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  })

describe('🧪 Testes API de Usuários (Auth)', () => {
  const email = `test+${Date.now()}@example.com`
  const password = '123456'
  const newPassword = 'nova123'
  let tokenFromRegister
  let tokenFromLogin

  test('Deve registrar um novo usuário (signup)', async () => {
    const res = await axios.post(`${AUTH}/register`, {
      name: 'Los',
      email,
      password
    })

    expect(res.status).toBe(201)
    expect(res.data).toHaveProperty('token')
    expect(typeof res.data.token).toBe('string')
    tokenFromRegister = res.data.token
  })

  test('Não deve permitir registrar o mesmo email novamente', async () => {
    try {
      await axios.post(`${AUTH}/register`, {
        name: 'Los',
        email,
        password
      })
      throw new Error('esperava 409 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(409)
    }
  })

  test('Deve fazer login (signin) e retornar token', async () => {
    const res = await axios.post(`${AUTH}/login`, {
      email,
      password
    })

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('token')
    tokenFromLogin = res.data.token
  })

  test('Deve negar acesso ao /me sem token', async () => {
    try {
      await axios.get(`${AUTH}/me`)
      throw new Error('esperava 401 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(401)
    }
  })

  test('Deve retornar o perfil do usuário autenticado (/me)', async () => {
    const api = clientWithToken(tokenFromLogin)
    const res = await api.get('/auth/me')

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('id')
    expect(res.data).toHaveProperty('email', email)
    expect(res.data).toHaveProperty('name')
  })

  test('Deve atualizar o perfil do usuário (/me PUT)', async () => {
    const api = clientWithToken(tokenFromLogin)
    const res = await api.put('/auth/me', {
      name: 'Los Fodas'
    })

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('name', 'Los Fodas')
  })

  test('Deve trocar a senha (/me/password PUT)', async () => {
    const api = clientWithToken(tokenFromLogin)
    const res = await api.put('/auth/me/password', {
      current_password: password,
      new_password: newPassword
    })

    expect(res.status).toBe(200)
  })

  test('Deve permitir login com a NOVA senha', async () => {
    const res = await axios.post(`${AUTH}/login`, {
      email,
      password: newPassword
    })

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('token')
  })

  test('Deve recusar login com a senha ANTIGA', async () => {
    try {
      await axios.post(`${AUTH}/login`, {
        email,
        password
      })
      throw new Error('esperava 401 e não veio')
    } catch (err) {
      expect(err.response.status).toBe(401)
    }
  })

  test('Token do signup também deve acessar /me', async () => {
    const api = clientWithToken(tokenFromRegister)
    const res = await api.get('/auth/me')

    expect(res.status).toBe(200)
    expect(res.data).toHaveProperty('email', email)
  })
})
