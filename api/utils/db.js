// /api/utils/db.js
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function initDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS financial_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `

  const createEntitiesTable = `
    CREATE TABLE IF NOT EXISTS financial_entities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(100),
      description TEXT,
      status ENUM('aberta','paga','cancelada') NOT NULL DEFAULT 'aberta',
      paid_at DATETIME NULL,
      CONSTRAINT fk_entities_fuser FOREIGN KEY (user_id) REFERENCES financial_users(id) ON DELETE CASCADE,
      INDEX idx_entities_user_id (user_id),
      INDEX idx_entities_status (status),
      INDEX idx_entities_paid_at (paid_at)
    ) ENGINE=InnoDB
  `

  const createItemsTable = `
    CREATE TABLE IF NOT EXISTS financial_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_id INT,
      description TEXT,
      type ENUM('entrada','saida'),
      value DECIMAL(10, 2),
      recurring BOOLEAN DEFAULT 0,
      installment_now INT DEFAULT 0,
      installment_max INT DEFAULT 0, 
      month_ref DATE,
      paid_at DATETIME NULL,
      CONSTRAINT fk_items_entity FOREIGN KEY (entity_id) REFERENCES financial_entities(id) ON DELETE CASCADE,
      INDEX idx_items_entity_id (entity_id),
      INDEX idx_items_month_ref (month_ref),
      INDEX idx_items_paid_at (paid_at)
    ) ENGINE=InnoDB
  `

  const conn = await pool.getConnection()
  try {
    await conn.query(createUsersTable)
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
