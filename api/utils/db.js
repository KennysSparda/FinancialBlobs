// /api/utils/db.js

const mysql = require('mysql2/promise')
const loginInfo = require('./loginInfo.js')

const pool = mysql.createPool({
  host: loginInfo.host,
  user: loginInfo.user,
  password: loginInfo.password,
  database: loginInfo.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Cria as tabelas se não existirem
async function initDatabase() {
  const createEntitiesTable = `
    CREATE TABLE IF NOT EXISTS financial_entities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      description TEXT,
      month_ref DATE
    );
  `

  const createItemsTable = `
    CREATE TABLE IF NOT EXISTS financial_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_id INT,
      description TEXT,
      type ENUM('entrada', 'saida'),
      value DECIMAL(10, 2),
      recurring BOOLEAN DEFAULT 0,
      installment_now INT DEFAULT 0,
      installment_max INT DEFAULT 0,
      FOREIGN KEY (entity_id) REFERENCES financial_entities(id) ON DELETE CASCADE
    );
  `

  const conn = await pool.getConnection()
  try {
    await conn.query(createEntitiesTable)
    await conn.query(createItemsTable)
    console.log('Tabelas verificadas/criadas com sucesso.')
  } catch (err) {
    console.error('Erro ao criar tabelas:', err)
  } finally {
    conn.release()
  }
}


initDatabase()

module.exports = pool
