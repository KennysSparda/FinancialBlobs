// /web/model.js

const API_BASE = 'http://localhost:3001/api/v1'

// Utilitários
async function request(method, path, data) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  if (data) config.body = JSON.stringify(data)

  const res = await fetch(`${API_BASE}${path}`, config)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Erro ${res.status}: ${text || res.statusText}`)
  }

  if (res.status === 204) return null

  return res.json()

}

// Entidades Financeiras
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
      entities.map(async (e) => {
        const items = await entityAPI.getItems(e.id)
        return { ...e, items }
      })
    )
    return withItems
  }
}

// Itens Financeiros
export const itemAPI = {
  list: () => request('GET', '/items'),
  get: (id) => request('GET', `/items/${id}`),
  create: (data) => request('POST', '/items', data),
  update: (id, data) => request('PUT', `/items/${id}`, data),
  remove: (id) => request('DELETE', `/items/${id}`)
}
