// /api/controllers/financialItemController.js
const FinancialItem = require('../models/financialItemModel')
const FinancialEntity = require('../models/financialEntityModel')
const FinancialItemService = require('../services/financialItemService')

module.exports = {
  async list(req, res) {
    try {
      const [rows] = await FinancialItem.listAllByUserId(req.userId)
      res.status(200).json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao listar itens' })
    }
  },

  async get(req, res) {
    try {
      const [rows] = await FinancialItem.getOwnedById(req.params.id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
      res.status(200).json(rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao buscar item' })
    }
  },

  async create(req, res) {
    try {
      const item = req.body

      if (!item.entity_id || !item.description || !item.type || !item.value || !item.month_ref) {
        return res.status(422).json({ error: 'Dados incompletos' })
      }

      // valida posse da entidade aqui também (camada extra)
      const [ent] = await FinancialEntity.getOwnedById(item.entity_id, req.userId)
      if (!ent.length) return res.status(404).json({ error: 'Entidade não encontrada' })

      // chama service passando userId
      const ids = await FinancialItemService.createWithRules(item, req.userId)

      res.status(201).json({
        message: `${ids.length} item(ns) criado(s) com sucesso`,
        ids
      })
    } catch (err) {
      console.error(err)
      const status = err.status || 500
      res.status(status).json({ error: err.message || 'Erro ao inserir item(s)' })
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id)
      const {
        description,
        type,
        value,
        recurring,
        installment_now,
        installment_max,
        month_ref
      } = req.body

      const [result] = await FinancialItem.updateOwned(id, req.userId, {
        description,
        type,
        value,
        recurring,
        installment_now,
        installment_max,
        month_ref
      })

      if (result.affectedRows === 0) return res.status(404).json({ error: 'Item não encontrado' })
      res.status(200).json({ message: 'Item atualizado com sucesso' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao atualizar item' })
    }
  },

  async remove(req, res) {
    try {
      const id = Number(req.params.id)

      // busca owned pra saber se é parcelado e também garantir posse
      const [rows] = await FinancialItem.getOwnedById(id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
      const item = rows[0]

      if (item.installment_max > 1) {
        await FinancialItem.deleteInstallmentGroupOwnedByItemId(id, req.userId)
      } else {
        const [result] = await FinancialItem.deleteOwned(id, req.userId)
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item não encontrado' })
      }

      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover item' })
    }
  }
}
