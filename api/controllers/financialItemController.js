// /api/controllers/financialItemController.js

const FinancialItem = require('../models/financialItemModel')

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
      const { name, value, entity_id, month_ref } = req.body
      const [result] = await FinancialItem.create({ name, value, entity_id, month_ref })
      res.status(201).location(`/api/v1/items/${result.insertId}`).json({
        message: 'Item criado',
        id: result.insertId
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao inserir item' })
    }
  },

  async update(req, res) {
    try {
      const { name, value, entity_id, month_ref } = req.body
      await FinancialItem.update(req.params.id, { name, value, entity_id, month_ref })
      res.status(200).json({ message: 'Item atualizado com sucesso' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao atualizar item' })
    }
  },

  async remove(req, res) {
    try {
      await FinancialItem.delete(req.params.id)
      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover item' })
    }
  }
}
