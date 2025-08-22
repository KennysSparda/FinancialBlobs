// /api/utils/migrate.js
require('dotenv').config()
const mysql = require('mysql2/promise')

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
    // 0) engines OK (InnoDB é default; se não for, ajuste manualmente)

    // 1) financial_users — cria se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS financial_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `)

    // 1.1) se existir "users" legado: migrar/renomear
    const [legacyUsers] = await conn.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `)
    if (legacyUsers.length) {
      // copiar dados (merge) e dropar tabela legada
      await conn.query(`
        INSERT INTO financial_users (id, name, email, password_hash, created_at)
        SELECT id, name, email, password_hash, created_at FROM users
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          password_hash = VALUES(password_hash)
      `)
      await conn.query(`DROP TABLE users`)
      console.log('> migrado conteúdo de users -> financial_users e removida a antiga')
    }

    // 1.2) usuário bootstrap id=1 se tabela estiver vazia
    const [countUsers] = await conn.query(`SELECT COUNT(*) AS c FROM financial_users`)
    if (countUsers[0].c === 0) {
      const dummyHash = '$2y$10$7l6s0R7Y4nK4k0x0x0x0xOeGq9iYkNnhvH8o7N0lC1XwY4q1q1q1q'
      await conn.query(
        `INSERT INTO financial_users (id, name, email, password_hash) VALUES (1, 'Bootstrap', 'bootstrap@example.com', ?)`,
        [dummyHash]
      )
      console.log('> usuário bootstrap id=1 criado')
    }

    // 2) financial_entities — cria base se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS financial_entities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        description TEXT
      ) ENGINE=InnoDB
    `)

    // 2.1) adiciona coluna user_id se não existir
    const [colUserId] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_entities' AND COLUMN_NAME = 'user_id'
    `)
    if (colUserId.length === 0) {
      await conn.query(`ALTER TABLE financial_entities ADD COLUMN user_id INT NULL`)
      console.log('> coluna financial_entities.user_id adicionada')
    }

    // 2.2) backfill user_id nulo com 1
    await conn.query(`UPDATE financial_entities SET user_id = 1 WHERE user_id IS NULL`)

    // 2.3) not null
    await conn.query(`ALTER TABLE financial_entities MODIFY user_id INT NOT NULL`)

    // 2.4) índice
    const [idxEntUser] = await conn.query(`
      SHOW INDEX FROM financial_entities WHERE Key_name = 'idx_entities_user_id'
    `)
    if (idxEntUser.length === 0) {
      await conn.query(`CREATE INDEX idx_entities_user_id ON financial_entities(user_id)`)
      console.log('> índice idx_entities_user_id criado')
    }

    // 2.5) derrubar FK antiga (se houver) e criar FK para financial_users
    // encontra qualquer FK em financial_entities que use user_id
    const [fksOnEntities] = await conn.query(`
      SELECT rc.CONSTRAINT_NAME, rc.REFERENCED_TABLE_NAME
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
        AND rc.TABLE_NAME = 'financial_entities'
        AND kcu.COLUMN_NAME = 'user_id'
    `)
    for (const fk of fksOnEntities) {
      if (fk.REFERENCED_TABLE_NAME !== 'financial_users') {
        await conn.query(`ALTER TABLE financial_entities DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``)
        console.log(`> FK antiga ${fk.CONSTRAINT_NAME} removida`)
      }
    }

    // cria FK se não houver uma apontando para financial_users
    const [fkEntitiesUsers] = await conn.query(`
      SELECT rc.CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
        AND rc.TABLE_NAME = 'financial_entities'
        AND rc.REFERENCED_TABLE_NAME = 'financial_users'
        AND kcu.COLUMN_NAME = 'user_id'
    `)
    if (fkEntitiesUsers.length === 0) {
      await conn.query(`
        ALTER TABLE financial_entities
          ADD CONSTRAINT fk_entities_fuser
          FOREIGN KEY (user_id) REFERENCES financial_users(id) ON DELETE CASCADE
      `)
      console.log('> FK fk_entities_fuser criada')
    }

    // 3) financial_items — cria base se não existir
    await conn.query(`
      CREATE TABLE IF NOT EXISTS financial_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT,
        description TEXT,
        type ENUM('entrada', 'saida'),
        value DECIMAL(10, 2),
        recurring BOOLEAN DEFAULT 0,
        installment_now INT DEFAULT 0,
        installment_max INT DEFAULT 0, 
        month_ref DATE
      ) ENGINE=InnoDB
    `)

    // 3.1) índices
    const [idxItemEntity] = await conn.query(`SHOW INDEX FROM financial_items WHERE Key_name = 'idx_items_entity_id'`)
    if (idxItemEntity.length === 0) {
      await conn.query(`CREATE INDEX idx_items_entity_id ON financial_items(entity_id)`)
      console.log('> índice idx_items_entity_id criado')
    }
    const [idxItemMonth] = await conn.query(`SHOW INDEX FROM financial_items WHERE Key_name = 'idx_items_month_ref'`)
    if (idxItemMonth.length === 0) {
      await conn.query(`CREATE INDEX idx_items_month_ref ON financial_items(month_ref)`)
      console.log('> índice idx_items_month_ref criado')
    }

    // 3.2) FK items->entities (drop antiga se necessário)
    const [fksOnItems] = await conn.query(`
      SELECT rc.CONSTRAINT_NAME, rc.REFERENCED_TABLE_NAME
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
        AND rc.TABLE_NAME = 'financial_items'
        AND kcu.COLUMN_NAME = 'entity_id'
    `)
    for (const fk of fksOnItems) {
      if (fk.REFERENCED_TABLE_NAME !== 'financial_entities') {
        await conn.query(`ALTER TABLE financial_items DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``)
        console.log(`> FK antiga em items ${fk.CONSTRAINT_NAME} removida`)
      }
    }

    const [fkItemsEntity] = await conn.query(`
      SELECT rc.CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
        AND rc.TABLE_NAME = 'financial_items'
        AND rc.REFERENCED_TABLE_NAME = 'financial_entities'
        AND kcu.COLUMN_NAME = 'entity_id'
    `)
    if (fkItemsEntity.length === 0) {
      // checa órfãos
      const [orphans] = await conn.query(`
        SELECT i.id
        FROM financial_items i
        LEFT JOIN financial_entities e ON e.id = i.entity_id
        WHERE i.entity_id IS NOT NULL AND e.id IS NULL
        LIMIT 1
      `)
      if (orphans.length) {
        console.warn('> há itens órfãos sem entidade. Ajuste/remova-os antes de criar a FK fk_items_entity')
      } else {
        await conn.query(`
          ALTER TABLE financial_items
            ADD CONSTRAINT fk_items_entity
            FOREIGN KEY (entity_id) REFERENCES financial_entities(id) ON DELETE CASCADE
        `)
        console.log('> FK fk_items_entity criada')
      }
    }

    console.log('Migração concluída com sucesso ✅')
  } catch (err) {
    console.error('Erro na migração:', err)
    process.exitCode = 1
  } finally {
    conn.release()
    process.exit()
  }
}

main()
