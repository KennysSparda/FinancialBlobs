// /api/routes/entities.js

const express = require('express')
const router = express.Router()
const controller = require('../controllers/financialEntityController')


router.get('/', controller.list)
router.get('/:id', controller.get)
router.get('/:id/items', controller.listItemsByEntityId)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router
