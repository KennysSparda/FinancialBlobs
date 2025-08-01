const axios = require('axios')

const BASE_URL = 'http://localhost:3001/api/v1/entities'

async function testCRUD() {
  try {
    // Criar uma entidade financeira
    const createResponse = await axios.post(BASE_URL, {
      name: 'Cartão Nubank - Agosto/2025',
      description: 'Gastos no cartão Nubank do mês de Agosto',
      month_ref: '2025-07-31'
    })
    console.log('🟢 Criado:', createResponse.data)

    // Buscar todas as entidades
    const listResponse = await axios.get(BASE_URL)
    console.log('📋 Todas as entidades:')
    console.table(listResponse.data)

    // Pegando o ID do item recém-criado
    const createdEntity = listResponse.data.find(e => e.name.includes('Nubank'))
    const entityId = createdEntity?.id
    if (!entityId) throw new Error('Entidade não encontrada para continuar o teste.')

    // Buscar por ID
    const getResponse = await axios.get(`${BASE_URL}/${entityId}`)
    console.log('🔍 Detalhe da entidade:', getResponse.data)

    // Editar entidade
    const updateResponse = await axios.put(`${BASE_URL}/${entityId}`, {
      name: 'Cartão Nubank Editado - Agosto/2025',
      description: 'Descrição atualizada dos gastos',
      month_ref: '2025-08-01'
    })
    console.log('✏️ Editado:', updateResponse.data)

    // Verificar se foi editada
    const updatedList = await axios.get(BASE_URL)
    console.log('📦 Lista após edição:')
    console.table(updatedList.data)

    // Excluir entidade
    const deleteResponse = await axios.delete(`${BASE_URL}/${entityId}`)
    console.log('🗑️ Deletado:', deleteResponse.data)

    // Verificar se sumiu
    const finalList = await axios.get(BASE_URL)
    console.log('📦 Lista após exclusão:')
    console.table(finalList.data)

  } catch (err) {
    console.error('❌ Erro durante o teste:', err.response?.data || err.message)
  }
}

testCRUD()
