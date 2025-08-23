// /api/routes/items.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/itemController')
const auth = require('../middleware/auth')

// Lista todos os itens pertencentes ao usuário (via JOIN nos controllers)
router.get('/', auth(), controller.list)

// Obtém item específico do usuário
router.get('/:id', auth(), controller.get)

// Cria item vinculado a uma entidade do usuário
router.post('/', auth(), controller.create)

// Atualiza item do usuário
router.put('/:id', auth(), controller.update)

// Remove item do usuário
router.delete('/:id', auth(), controller.remove)

module.exports = router
