// /api/routes/entities.js

const express = require('express')
const router = express.Router()
const controller = require('../controllers/financialEntityController')
const { generateNextMonth } = require('../services/monthGenerator')

router.get('/', controller.list)
router.get('/:id', controller.get)
router.get('/:id/items', controller.listItemsByEntityId)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.remove)

router.post('/generate-next-month', async (req, res) => {
  const { fromMonth } = req.body
  const result = await generateNextMonth(fromMonth)
  res.json(result)
})

module.exports = router
