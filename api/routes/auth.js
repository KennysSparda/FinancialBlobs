// /api/routes/auth.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/authController')
const auth = require('../middleware/auth')

router.post('/register', controller.register) // signup
router.post('/login', controller.login)       // signin

router.get('/me', auth(), controller.me)
router.put('/me', auth(), controller.updateMe)
router.put('/me/password', auth(), controller.changePassword)

module.exports = router
