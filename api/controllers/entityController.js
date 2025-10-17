// /api/controllers/entityController.js
const EntityModel = require('../models/entityModel')
const ItemModel = require('../models/itemModel')

module.exports = {
  async list(req, res) {
    try {
      const [rows] = await EntityModel.getAllByUserId(req.userId)
      res.json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao listar entidades' })
    }
  },

  async get(req, res) {
    try {
      const [rows] = await EntityModel.getOwnedById(req.params.id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.json(rows[0])
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao buscar entidade' })
    }
  },

  async create(req, res) {
    const { name, description } = req.body
    if (!name || !description) {
      res.status(422).json({ error: 'Erro ao obter dados para criação da entidade, verifique-os e tente novamente!' })
      return
    }
    try {
      const [result] = await EntityModel.createForUser(req.userId, { name, description })
      res.status(201)
        .location(`/api/v1/entities/${result.insertId}`)
        .json({ message: 'Entidade criada', id: result.insertId })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao inserir entidade' })
    }
  },

  async update(req, res) {
    try {
      const { name, description } = req.body
      const [result] = await EntityModel.updateOwned(req.params.id, req.userId, { name, description })
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.json({ message: 'Updated' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao atualizar entidade' })
    }
  },

  async remove(req, res) {
    try {
      const [result] = await EntityModel.deleteOwned(req.params.id, req.userId)
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover entidade' })
    }
  },

  async listItemsByEntityId(req, res) {
    try {
      const [items] = await ItemModel.getByEntityIdOwned(req.params.id, req.userId)
      res.status(200).json(items)
    } catch (err) {
      console.error('[ERRO] Falha ao buscar itens:', err)
      res.status(500).json({ error: 'Erro ao buscar itens da entidade' })
    }
  },

  // ===== novos handlers p/ cobrir os testes =====

  async pay(req, res) {
    try {
      const [result] = await EntityModel.markPaidOwned(req.params.id, req.userId, null)
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.status(200).json({ message: 'Entidade marcada como paga' })
    } catch (err) {
      console.error('pay', err)
      res.status(500).json({ error: 'Falha ao marcar entidade como paga' })
    }
  },

  async reopen(req, res) {
    try {
      const [result] = await EntityModel.reopenOwned(req.params.id, req.userId)
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.status(200).json({ message: 'Entidade reaberta' })
    } catch (err) {
      console.error('reopen', err)
      res.status(500).json({ error: 'Falha ao reabrir entidade' })
    }
  },

  async cancel(req, res) {
    try {
      const [result] = await EntityModel.cancelOwned(req.params.id, req.userId)
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entidade não encontrada' })
      res.status(200).json({ message: 'Entidade cancelada' })
    } catch (err) {
      console.error('cancel', err)
      res.status(500).json({ error: 'Falha ao cancelar entidade' })
    }
  },

  async payAllItems(req, res) {
    try {
      // idempotente, mesmo se não houver itens
      await EntityModel.markAllItemsPaidOwned(req.params.id, req.userId, null)
      res.status(200).json({ message: 'Itens da entidade marcados como pagos' })
    } catch (err) {
      console.error('payAllItems', err)
      res.status(500).json({ error: 'Falha ao pagar itens da entidade' })
    }
  },

  // /api/controllers/entityController.js
  async progress(req, res) {
    try {
      const data = await EntityModel.getProgressOwned(req.params.id, req.userId)
      if (!data) return res.status(404).json({ error: 'Entidade não encontrada' })

      const normalized = {
        ...data,
        items_total: Number(data.items_total),
        items_pagos: Number(data.items_pagos),
        pct_pago: Number(data.pct_pago)
      }

      res.status(200).json(normalized)
    } catch (err) {
      console.error('progress', err)
      res.status(500).json({ error: 'Falha ao obter progresso da entidade' })
    }
  },

  // ===== utilitários já existentes =====

  async clearEntityByMonth(req, res) {
    try {
      const { id } = req.params
      const year = parseInt(req.query.year, 10)
      const month = parseInt(req.query.month, 10)

      if (!id || Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Parâmetros inválidos: id, year, month' })
      }

      const count = await deleteItemsByEntityAndMonth(id, year, month)
      res.json({ ok: true, removed: count })
    } catch (err) {
      console.error('clearEntityByMonth', err)
      res.status(500).json({ error: 'Falha ao limpar itens do mês' })
    }
  },

  async clearEntityAll(req, res) {
    try {
      const { id } = req.params
      if (!id) return res.status(400).json({ error: 'Parâmetro id é obrigatório' })

      const count = await deleteItemsByEntity(id)
      res.json({ ok: true, removed: count })
    } catch (err) {
      console.error('clearEntityAll', err)
      res.status(500).json({ error: 'Falha ao limpar todos os itens da entidade' })
    }
  }
}
