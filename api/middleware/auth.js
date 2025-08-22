// /api/middleware/auth.js
const jwt = require('jsonwebtoken')

function auth(required = true) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || ''
      const token = header.startsWith('Bearer ') ? header.slice(7) : null

      if (!token) {
        if (required) return res.status(401).json({ error: 'token ausente' })
        req.userId = null
        return next()
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = Number(decoded.sub)
      next()
    } catch (e) {
      return res.status(401).json({ error: 'token inválido ou expirado' })
    }
  }
}

module.exports = auth
