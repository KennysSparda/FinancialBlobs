// /api/models/userModel.js
const db = require('../utils/db')

module.exports = {
  create: (name, email, passwordHash) => {
    return db.query(
      'INSERT INTO financial_users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    )
  },

  findByEmail: (email) => {
    return db.query(
      'SELECT id, name, email, password_hash, created_at FROM financial_users WHERE email = ?',
      [email]
    )
  },

  findById: (id) => {
    return db.query(
      'SELECT id, name, email, created_at FROM financial_users WHERE id = ?',
      [id]
    )
  },

  // usado pelo changePassword
  findSecretById: (id) => {
    return db.query(
      'SELECT password_hash FROM financial_users WHERE id = ?',
      [id]
    )
  },

  updateProfileOwned: (id, data) => {
    return db.query(
      'UPDATE financial_users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
      [data.name ?? null, data.email ?? null, id]
    )
  },

  updatePasswordOwned: (id, passwordHash) => {
    return db.query(
      'UPDATE financial_users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    )
  }
}
