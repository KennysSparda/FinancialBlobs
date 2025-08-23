// src/api.js

import { getToken, clearToken } from './auth.js'

const API_BASE = 'http://localhost:3001/api/v1'

async function request(method, path, data) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const config = { method, headers }
  if (data) config.body = JSON.stringify(data)

  const res = await fetch(`${API_BASE}${path}`, config)

  // intercepta 401 para que o app possa abrir modal de login
  if (res.status === 401) {
    // opcional: limpar token inválido
    clearToken()
    const text = await res.text().catch(() => '')
    const err = new Error(`Unauthorized: ${text || '401'}`)
    err.status = 401
    throw err
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Erro ${res.status}: ${text || res.statusText}`)
    err.status = res.status
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}

// Auth
export const authAPI = {
  register: (payload) => request('POST', '/auth/register', payload),
  login: (payload) => request('POST', '/auth/login', payload),
  me: () => request('GET', '/auth/me'),
  updateMe: (payload) => request('PUT', '/auth/me', payload),
  changePassword: (payload) => request('PUT', '/auth/me/password', payload)
}

// Entidades
export const entityAPI = {
  list: () => request('GET', '/entities'),
  get: (id) => request('GET', `/entities/${id}`),
  create: (data) => request('POST', '/entities', data),
  update: (id, data) => request('PUT', `/entities/${id}`, data),
  remove: (id) => request('DELETE', `/entities/${id}`),
  getItems: (id) => request('GET', `/entities/${id}/items`),
  listWithItems: async () => {
    const entities = await entityAPI.list()
    const withItems = await Promise.all(
      entities.map(async e => {
        const items = await entityAPI.getItems(e.id)
        return { ...e, items }
      })
    )
    return withItems
  }
}

// Itens
export const itemAPI = {
  list: () => request('GET', '/items'),
  get: (id) => request('GET', `/items/${id}`),
  create: (data) => request('POST', '/items', data),
  update: (id, data) => request('PUT', `/items/${id}`, data),
  remove: (id) => request('DELETE', `/items/${id}`)
}
