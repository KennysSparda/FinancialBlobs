const axios = require('axios')

const BASE_URL = 'http://localhost:3001'
const ENTITY_URL = `${BASE_URL}/entities`
const GENERATE_URL = `${ENTITY_URL}/generate-next-month`

async function testGenerateNextMonth() {
  const baseMonth = '2025-08-01'

  // 1. Criar uma entidade com item parcelado (3x)
  const created = await axios.post(ENTITY_URL, {
    name: 'Assinatura TV - Agosto/2025',
    description: 'Plano mensal parcelado em 3x',
    month_ref: '2025-08-01'
  })

  const entityId = created.data.id || (await axios.get(ENTITY_URL)).data.pop().id

  // 2. Inserir item manualmente com parcela 1/3
  await axios.post(`${BASE_URL}/items`, {
    entity_id: entityId,
    description: 'Assinatura TV Agosto',
    type: 'saida', // deve ser 'entrada' ou 'saida' conforme seu ENUM no DB
    value: 120.0,
    recurring: false,
    installment_now: 1,
    installment_max: 3
  })

  // 3. Gerar o próximo mês
  const genResponse = await axios.post(GENERATE_URL, {
    fromMonth: baseMonth
  })
  console.log('🆕 Resultado do gerador de mês:', genResponse.data)

  const nextMonth = '2025-09-01'

  // 4. Buscar entidades do próximo mês
  const allEntities = await axios.get(ENTITY_URL)
  const nextEntities = allEntities.data.filter(e => e.name.includes('Setembro'))
  console.log('📅 Entidades criadas para o próximo mês:')
  console.table(nextEntities)

  if (nextEntities.length === 0) {
    console.error('❌ Nenhuma entidade criada para o mês seguinte.')
  } else {
    console.log('✅ Geração de mês seguinte parece ter funcionado.')
  }
}

testGenerateNextMonth().catch(err => {
  console.error('❌ Erro no teste:', err.response?.data || err.message)
})
