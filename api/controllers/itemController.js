// /api/controllers/itemController.js
const ItemModel = require('../models/itemModel')
const EntityModel = require('../models/entityModel')
const ItemService = require('../services/itemService')

const SCOPE = ['one', 'forward', 'all']

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
      if (!item.entity_id || !item.description || !item.type || !item.value || !item.month_ref) {
        return res.status(422).json({ error: 'Dados incompletos' })
      }

      // valida posse da entidade
      const [ent] = await EntityModel.getOwnedById(item.entity_id, req.userId)
      if (!ent.length) {
        return res.status(404).json({ error: 'Entidade não encontrada para este usuário' })
      }

      // cria com regras (dedupe e parcelas/recorrência)
      const result = await ItemService.createWithRules(item, req.userId)

      // se nada foi criado, responder 409 (esperado nos testes)
      if (!result.created_count) {
        return res.status(409).json({
          error: 'Itens já existem para os meses informados — nada foi criado',
          details: { skipped_count: result.skipped_count, skipped: result.skipped }
        })
      }

      return res.status(201).json({
        message: `${result.created_count} item(ns) criado(s). ${result.skipped_count} ignorado(s).`,
        ...result
      })
    } catch (err) {
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

      const scope = SCOPE.includes(req.query.scope) ? req.query.scope : 'one'

      // ancora + ownership
      const [rows] = await ItemModel.getOwnedById(id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
      const anchor = rows[0]

      const data = {
        description: req.body.description,
        type: req.body.type,
        value: req.body.value,
        recurring: req.body.recurring,
        installment_now: req.body.installment_now,
        installment_max: req.body.installment_max,
        month_ref: req.body.month_ref
      }

      let result
      if (scope === 'one') {
        ;[result] = await ItemModel.updateOwned(id, req.userId, data)
      } else if (anchor.installment_max > 1) {
        result = await ItemModel.updateInstallmentSeriesOwnedByAnchor(anchor, req.userId, scope, data)
      } else if (anchor.recurring) {
        result = await ItemModel.updateRecurringSeriesOwnedByAnchor(anchor, req.userId, scope, data)
      } else {
        ;[result] = await ItemModel.updateOwned(id, req.userId, data)
      }

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: 'Nada foi atualizado' })
      }

      res.status(200).json({ message: `Atualizado (${result.affectedRows})` })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao atualizar item' })
    }
  },

  // /api/controllers/itemController.js (apenas o método remove)
  async remove(req, res) {
    try {
      const id = Number(req.params.id)
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID inválido' })
      }

      // ancora do item (com ownership)
      const [rows] = await ItemModel.getOwnedById(id, req.userId)
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' })
      const anchor = rows[0]

      // escopo vindo da query
      const rawScope = req.query.scope
      const validScopes = ['one', 'forward', 'all']

      // regra de default:
      // - parcelado (installment_max > 1): default = 'all' (compat com comportamento antigo/teste)
      // - recorrente: default = 'one' (ou 'forward' se preferir)
      let scope = validScopes.includes(rawScope) ? rawScope : 'one'
      if (!rawScope && anchor.installment_max > 1) {
        scope = 'all'
      }
      // se quiser default 'forward' para recorrentes, descomente:
      // if (!rawScope && anchor.recurring) {
      //   scope = 'forward'
      // }

      let result
      if (scope === 'one') {
        ;[result] = await ItemModel.deleteOwned(id, req.userId)
      } else if (anchor.installment_max > 1) {
        result = await ItemModel.deleteInstallmentSeriesOwnedByAnchor(anchor, req.userId, scope)
      } else if (anchor.recurring) {
        result = await ItemModel.deleteRecurringSeriesOwnedByAnchor(anchor, req.userId, scope)
      } else {
        ;[result] = await ItemModel.deleteOwned(id, req.userId)
      }

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: 'Nada foi removido' })
      }

      res.status(204).send()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Erro ao remover item' })
    }
  }

}
