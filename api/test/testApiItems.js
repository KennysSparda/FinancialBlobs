const axios = require('axios')

const BASE_URL = 'http://localhost:3001/items'
const ENTITY_URL = 'http://localhost:3001/entities'

async function testItemCRUD() {
  try {
    // 1️⃣ Criar uma entidade associada (pois cada item precisa de entity_id)
    const entityRes = await axios.post(ENTITY_URL, {
      name: 'Entidade Teste Itens',
      description: 'Entidade temporária para testar itens',
      month_ref: '2025-08-01'
    })

    const entityId = entityRes.data.id || entityRes.data.insertId
    console.log('🏷️ Entidade criada para testes de item:', entityId)

    // 2️⃣ Criar um item financeiro vinculado à entidade
    const createRes = await axios.post(BASE_URL, {
      entity_id: entityId,
      description: 'Compra de supermercado',
      type: 'saida',
      value: 150.75,
      recurring: false,
      installment_now: 1,
      installment_max: 3
    })
    console.log('🟢 Item criado:', createRes.data)

    // 3️⃣ Listar todos os itens
    const listRes = await axios.get(BASE_URL)
    console.log('📋 Todos os itens:')
    console.table(listRes.data)

    // 4️⃣ Buscar o item recém-criado
    const createdItem = listRes.data.find(i => i.entity_id === entityId)
    const itemId = createdItem?.id
    if (!itemId) throw new Error('Item não encontrado.')

    const getRes = await axios.get(`${BASE_URL}/${itemId}`)
    console.log('🔍 Item específico:', getRes.data)

    // 5️⃣ Atualizar o item
    const updateRes = await axios.put(`${BASE_URL}/${itemId}`, {
      description: 'Compra no mercado atualizada',
      type: 'saida',
      value: 175.99,
      recurring: true,
      installment_now: 2,
      installment_max: 3
    })
    console.log('✏️ Item atualizado:', updateRes.data)

    // 6️⃣ Remover o item
    const deleteRes = await axios.delete(`${BASE_URL}/${itemId}`)
    console.log('🗑️ Item deletado:', deleteRes.data)

    // 7️⃣ Limpeza: deletar entidade de teste
    const cleanEntity = await axios.delete(`${ENTITY_URL}/${entityId}`)
    console.log('♻️ Entidade de teste removida:', cleanEntity.data)

  } catch (err) {
    console.error('❌ Erro durante teste de item:', err.response?.data || err.message)
  }
}

testItemCRUD()
