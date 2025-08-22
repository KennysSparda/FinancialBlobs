// /api/routes/entities.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/financialEntityController')
const auth = require('../middleware/auth')

// Lista entidades do usuário logado
router.get('/', auth(), controller.list)

// Obtém entidade específica do usuário
router.get('/:id', auth(), controller.get)

// Lista itens de uma entidade do usuário
router.get('/:id/items', auth(), controller.listItemsByEntityId)

// Cria entidade para o usuário
router.post('/', auth(), controller.create)

// Atualiza entidade do usuário
router.put('/:id', auth(), controller.update)

// Remove entidade do usuário
router.delete('/:id', auth(), controller.remove)

module.exports = router
