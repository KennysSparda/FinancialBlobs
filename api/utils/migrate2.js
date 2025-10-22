// /api/utils/migrate2.js
require('dotenv').config()
const mysql = require('mysql2/promise')

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  return rows.length > 0
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
    [indexName]
  )
  return rows.length > 0
}

async function viewExists(conn, viewName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.VIEWS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [viewName]
  )
  return rows.length > 0
}

async function ensureTableExists(conn, ddl) {
  await conn.query(ddl)
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  const conn = await pool.getConnection()
  try {
    // ===== 0) Garantir que as tabelas-base existem (no-ops se já existem) =====
    await ensureTableExists(conn, `
      CREATE TABLE IF NOT EXISTS financial_entities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(100),
        description TEXT
      ) ENGINE=InnoDB
    `)

    await ensureTableExists(conn, `
      CREATE TABLE IF NOT EXISTS financial_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT,
        description TEXT,
        type ENUM('entrada','saida'),
        value DECIMAL(10,2),
        recurring BOOLEAN DEFAULT 0,
        installment_now INT DEFAULT 0,
        installment_max INT DEFAULT 0,
        month_ref DATE
      ) ENGINE=InnoDB
    `)

    // ===== 2.1) financial_entities: status, paid_at + índices =====
    const hasStatus = await columnExists(conn, 'financial_entities', 'status')
    if (!hasStatus) {
      await conn.query(`
        ALTER TABLE financial_entities
        ADD COLUMN status ENUM('aberta','paga','cancelada')
        NOT NULL DEFAULT 'aberta'
        AFTER description
      `)
      console.log('> financial_entities.status criado')
    } else {
      // Garante o tipo/enum/default correto (seguro se já estiver igual)
      await conn.query(`
        ALTER TABLE financial_entities
        MODIFY COLUMN status ENUM('aberta','paga','cancelada')
        NOT NULL DEFAULT 'aberta'
      `)
    }

    const hasPaidAtEnt = await columnExists(conn, 'financial_entities', 'paid_at')
    if (!hasPaidAtEnt) {
      await conn.query(`
        ALTER TABLE financial_entities
        ADD COLUMN paid_at DATETIME NULL AFTER status
      `)
      console.log('> financial_entities.paid_at criado')
    }

    if (!(await indexExists(conn, 'financial_entities', 'idx_entities_status'))) {
      await conn.query(`CREATE INDEX idx_entities_status ON financial_entities(status)`)
      console.log('> índice idx_entities_status criado')
    }
    if (!(await indexExists(conn, 'financial_entities', 'idx_entities_paid_at'))) {
      await conn.query(`CREATE INDEX idx_entities_paid_at ON financial_entities(paid_at)`)
      console.log('> índice idx_entities_paid_at criado')
    }

    // Backfill simples caso tenha registros antigos sem status
    await conn.query(`UPDATE financial_entities SET status = 'aberta' WHERE status IS NULL`)

    // ===== 2.2) financial_items: paid_at (opcional) + índice =====
    const hasPaidAtItem = await columnExists(conn, 'financial_items', 'paid_at')
    if (!hasPaidAtItem) {
      await conn.query(`
        ALTER TABLE financial_items
        ADD COLUMN paid_at DATETIME NULL AFTER month_ref
      `)
      console.log('> financial_items.paid_at criado')
    }

    if (!(await indexExists(conn, 'financial_items', 'idx_items_paid_at'))) {
      await conn.query(`CREATE INDEX idx_items_paid_at ON financial_items(paid_at)`)
      console.log('> índice idx_items_paid_at criado')
    }

    // ===== 2.3) VIEW: progresso por entidade (CAST p/ evitar strings) =====
    // Usamos CREATE OR REPLACE para forçar a definição correta
    const viewSQL = `
      CREATE OR REPLACE VIEW v_entity_progress AS
      SELECT
        e.id AS entity_id,
        e.user_id,
        e.name,
        e.status,
        e.paid_at,
        CAST(COUNT(i.id) AS UNSIGNED) AS items_total,
        CAST(SUM(CASE WHEN i.paid_at IS NOT NULL THEN 1 ELSE 0 END) AS UNSIGNED) AS items_pagos,
        ROUND(
          CASE WHEN COUNT(i.id) = 0 THEN 0
               ELSE 100 * SUM(CASE WHEN i.paid_at IS NOT NULL THEN 1 ELSE 0 END) / COUNT(i.id)
          END, 2
        ) AS pct_pago
      FROM financial_entities e
      LEFT JOIN financial_items i ON i.entity_id = e.id
      GROUP BY e.id, e.user_id, e.name, e.status, e.paid_at
    `
    await conn.query(viewSQL)
    console.log('> view v_entity_progress criada/atualizada')

    console.log('Migração 2.x concluída com sucesso ✅')
  } catch (err) {
    console.error('Erro na migração 2.x:', err)
    process.exitCode = 1
  } finally {
    conn.release()
    process.exit()
  }
}

main()
