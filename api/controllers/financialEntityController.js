// /api/controllers/financialEntityController.js

const FinancialEntity = require('../models/financialEntityModel')
const FinancialItem = require('../models/financialItemModel')

module.exports = {
  async list(req, res) {
    const [rows] = await FinancialEntity.getAll()
    res.json(rows)
  },

  async get(req, res) {
    const [rows] = await FinancialEntity.getById(req.params.id)
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  },

  async create(req, res) {
    const { name, description } = req.body
    if(!name || !description ) {
      res.status(422).json({ error: 'Erro ao obter dados para criação da entidade, verifique-os e tente novamente!' })
      return
    }
    try {
      const [result] = await FinancialEntity.create({ name, description })
      res.status(201).location(`/api/v1/entities/${result.insertId}`).json({
        message: 'Entidade criada',
        id: result.insertId
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao inserir entidade' })
    }
  },

  async update(req, res) {
    const { name, description } = req.body
    await FinancialEntity.update(req.params.id, { name, description })
    res.json({ message: 'Updated' })
  },

  async remove(req, res) {
    await FinancialEntity.delete(req.params.id)
    res.status(204).send()
  },

  async listItemsByEntityId(req, res) {
    try {
      const [items] = await FinancialItem.getByEntityId(req.params.id)
      res.status(200).json(items)
    } catch (err) {
      console.error('[ERRO] Falha ao buscar itens:', err)
      res.status(500).json({ error: 'Erro ao buscar itens da entidade' })
    }
  }
}
