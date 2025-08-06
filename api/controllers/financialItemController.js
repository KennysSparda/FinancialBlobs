// /api/controllers/financialItemController.js

const FinancialItem = require('../models/financialItemModel')

const FinancialItemService = require('../services/financialItemService')


module.exports = {
  async list(req, res) {
    try {
      const [rows] = await FinancialItem.getAll()
      res.status(200).json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao listar itens' })
    }
  },

  async get(req, res) {
    try {
      const [rows] = await FinancialItem.getById(req.params.id)
      if (!rows.length) {
        return res.status(404).json({ error: 'Item não encontrado' })
      }
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

      const ids = await FinancialItemService.createWithRules(item)

      res.status(201).json({
        message: `${ids.length} item(ns) criado(s) com sucesso`,
        ids
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao inserir item(s)' })
    }
  },

  async update(req, res) {
    try {
      const {
        description,
        type,
        value,
        recurring,
        installment_now,
        installment_max,
        month_ref
      } = req.body

      await FinancialItem.update(req.params.id, {
        description,
        type,
        value,
        recurring,
        installment_now,
        installment_max,
        month_ref
      })

      res.status(200).json({ message: 'Item atualizado com sucesso' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao atualizar item' })
    }
  },

  async remove(req, res) {
    try {
      const [rows] = await FinancialItem.getById(req.params.id)
      if (!rows.length) {
        return res.status(404).json({ error: 'Item não encontrado' })
      }

      const item = rows[0]

      // Se for item parcelado, apaga o grupo inteiro
      if (item.installment_max > 1) {
        await FinancialItem.deleteInstallmentGroup(item)
      } else {
        await FinancialItem.delete(req.params.id)
      }

      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover item' })
    }
  }

}
