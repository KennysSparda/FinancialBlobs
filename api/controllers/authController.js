// /api/controllers/authController.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')

function signToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_EXPIRES || '7d'
  })
}

module.exports = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body
      if (!name || !email || !password) {
        return res.status(422).json({ error: 'name, email e password são obrigatórios' })
      }

      const [exists] = await UserModel.findByEmail(email)
      if (exists.length) {
        return res.status(409).json({ error: 'email já cadastrado' })
      }

      const hash = await bcrypt.hash(password, 10)
      const [result] = await UserModel.create(name, email, hash)
      const token = signToken(result.insertId)

      res.status(201).json({ token })
      console.log(`[${new Date().toLocaleString()}] Usuário registrado: ${email}`)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'erro ao registrar' })
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(422).json({ error: 'email e password são obrigatórios' })
      }

      const [rows] = await UserModel.findByEmail(email)
      if (!rows.length) {
        return res.status(401).json({ error: 'credenciais inválidas' })
      }

      const user = rows[0]
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) {
        return res.status(401).json({ error: 'credenciais inválidas' })
      }

      const token = signToken(user.id)
      res.json({ token })
      console.log(`[${new Date().toLocaleString()}] Usuário logado: ${email}`)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'erro no login' })
    }
  },

  async me(req, res) {
    try {
      const [rows] = await UserModel.findById(req.userId)
      if (!rows.length) return res.status(404).json({ error: 'usuário não encontrado' })
      res.json(rows[0])
      console.log(`[${new Date().toLocaleString()}] Perfil acessado: ${rows[0].email}`)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'erro ao obter perfil' })
    }
  },

  async updateMe(req, res) {
    try {
      const { name, email } = req.body
      if (!name && !email) {
        return res.status(422).json({ error: 'nada para atualizar' })
      }

      if (email) {
        const [existing] = await UserModel.findByEmail(email)
        if (existing.length && existing[0].id !== req.userId) {
          return res.status(409).json({ error: 'email já em uso' })
        }
      }

      const [result] = await UserModel.updateProfileOwned(req.userId, { name, email })
      if (result.affectedRows === 0) return res.status(404).json({ error: 'usuário não encontrado' })

      const [rows] = await UserModel.findById(req.userId)
      res.json(rows[0])
      console.log(`[${new Date().toLocaleString()}] Perfil atualizado: ${rows[0].email}`)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'erro ao atualizar perfil' })
    }
  },

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body
      if (!current_password || !new_password) {
        return res.status(422).json({ error: 'current_password e new_password são obrigatórios' })
      }

      const [secretRows] = await UserModel.findSecretById(req.userId)
      if (!secretRows.length) return res.status(404).json({ error: 'usuário não encontrado' })

      const ok = await bcrypt.compare(current_password, secretRows[0].password_hash)
      if (!ok) return res.status(401).json({ error: 'senha atual inválida' })

      const newHash = await bcrypt.hash(new_password, 10)
      await UserModel.updatePasswordOwned(req.userId, newHash)

      res.json({ message: 'senha atualizada com sucesso' })
      console.log(`[${new Date().toLocaleString()}] Senha alterada para o usuário ID: ${req.userId}`)
      
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'erro ao alterar senha' })
    }
  }
}
