// /api/controllers/itemController.js
const ItemModel = require('../models/itemModel')
const EntityModel = require('../models/entityModel')
const ItemService = require('../services/itemService')

module.exports = {
  async list(req, res) {
    try {
      const [rows] = await ItemModel.listAllByUserId(req.userId)
      res.status(200).json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao listar itens' })
    }
  },

  async get(req, res) {
    try {
      const [rows] = await ItemModel.getOwnedById(req.params.id, req.userId)
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

      // 1) valida payload
      if (!item.entity_id || !item.description || !item.type || !item.value || !item.month_ref) {
        return res.status(422).json({ error: 'Dados incompletos' })
      }

      // 2) valida posse da entidade (camada extra de segurança na API)
      //    garanta que existe no model: getOwnedById(entityId, userId)
      const [ent] = await EntityModel.getOwnedById(item.entity_id, req.userId)
      if (!ent.length) {
        return res.status(404).json({ error: 'Entidade não encontrada para este usuário' })
      }

      // 3) cria com regras (service retorna resumo: created/skipped)
      const result = await ItemService.createWithRules(item, req.userId)

      // 4) se nada foi criado, responde 409 com detalhes para o front exibir
      if (!result.created_count || result.created_count === 0) {
        return res.status(409).json({
          error: 'Itens já existem para os meses informados — nada foi criado',
          details: { skipped_count: result.skipped_count, skipped: result.skipped }
        })
      }

      // 5) criado com sucesso (pode ter itens ignorados também)
      return res.status(201).json({
        message: `${result.created_count} item(ns) criado(s). ${result.skipped_count} ignorado(s).`,
        ...result
      })
    } catch (err) {
      // erros “esperados” com status vindo do service (ex.: 404 ownership)
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          ...(err.details ? { details: err.details } : {})
        })
      }
      console.error(err)
      return res.status(500).json({ error: 'Erro ao inserir item(s)' })
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id)
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID inválido' })
      }
      const {
        description,
        type,
        value,
        recurring,
        installment_now,
        installment_max,
        month_ref
      } = req.body

      const [result] = await ItemModel.updateOwned(id, req.userId, {
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
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID inválido' })
      }

      // busca owned pra saber se é parcelado e também garantir posse
      const [rows] = await ItemModel.getOwnedById(id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
      const item = rows[0]

      if (item.installment_max > 1) {
        await ItemModel.deleteInstallmentGroupOwnedByItemId(id, req.userId)
      } else {
        const [result] = await ItemModel.deleteOwned(id, req.userId)
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item não encontrado' })
      }

      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover item' })
    }
  }
}
