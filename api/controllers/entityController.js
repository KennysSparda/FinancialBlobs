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
      // se a entidade não for do usuário, lista vem vazia — podemos diferenciar 404 se preferir:
      if (!items.length) {
        // opção: verificar posse explícita e retornar 404
        // const [ent] = await EntityModel.getOwnedById(req.params.id, req.userId)
        // if (!ent.length) return res.status(404).json({ error: 'Entidade não encontrada' })
      }
      res.status(200).json(items)
    } catch (err) {
      console.error('[ERRO] Falha ao buscar itens:', err)
      res.status(500).json({ error: 'Erro ao buscar itens da entidade' })
    }
  }
}
