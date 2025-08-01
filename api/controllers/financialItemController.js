// /api/controllers/financialItemController.js

const FinancialItem = require('../models/financialItemModel')

exports.create = async (req, res) => {
  try {
    const [result] = await FinancialItem.create(req.body)
    // res.status(201).json({ message: 'Item criado com sucesso' })
    res.status(201).location(`/api/v1/items/${result.insertId}`).json({
      message: 'Item criado',
      id: result.insertId
    }) 
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao inserir item' })
  }
}

exports.list = async (req, res) => {
  try {
    const [rows] = await FinancialItem.getAll()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar itens' })
  }
}

exports.get = async (req, res) => {
  try {
    const [rows] = await FinancialItem.getById(req.params.id)
    if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar item' })
  }
}

exports.update = async (req, res) => {
  try {
    await FinancialItem.update(req.params.id, req.body)
    res.json({ message: 'Item atualizado com sucesso' })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar item' })
  }
}

exports.remove = async (req, res) => {
  try {
    await FinancialItem.delete(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover item' })
  }
}
