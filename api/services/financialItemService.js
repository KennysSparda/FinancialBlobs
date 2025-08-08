// /api/services/financialItemService.js

const FinancialItem = require('../models/financialItemModel')
const dayjs = require('dayjs')

async function createWithRules(itemData) {
    const {
        entity_id,
        description,
        type,
        value,
        recurring,
        installment_now = 1,
        installment_max = 1,
        month_ref
    } = itemData

    const itemsToInsert = []

    const startMonth = dayjs(month_ref)
    const [existing] = await FinancialItem.getByEntityId(entity_id)

    const count = recurring ? 24 : (installment_max - installment_now + 1)

    for (let i = 0; i < count; i++) {
    const currentInstallment = installment_now + i
    const ref = startMonth.add(i, 'month').format('YYYY-MM-DD')

    // Só verifica duplicidade para recorrentes ou parcelados com mesmo valor
    const duplicate = (recurring || installment_max > 1) && existing.find(e =>
        e.description === description &&
        Number(e.value) === Number(value) &&
        dayjs(e.month_ref).format('YYYY-MM') === ref.slice(0, 7)
    );


    if (duplicate) continue

    itemsToInsert.push({
        entity_id,
        description,
        type,
        value,
        recurring,
        installment_now: currentInstallment,
        installment_max,
        month_ref: ref
    })
    }


    const results = []
    for (const item of itemsToInsert) {
        const [res] = await FinancialItem.create(item)
        results.push(res.insertId)
    }

    return results
}


module.exports = {
    createWithRules
}
