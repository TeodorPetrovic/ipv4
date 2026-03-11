import { getDb } from '../utils/db'
import mysql from 'mysql2/promise'

// Create the database and tables on server startup
export default defineNitroPlugin(async () => {
  // First ensure the database exists (connect without specifying a DB)
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    })
    const dbName = process.env.MYSQL_DATABASE || 'ipv4_test'
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    await conn.end()
  } catch (err) {
    console.error('[db] Could not ensure database exists:', err)
  }

  // Now run DDL via the pool
  try {
    const db = getDb()
    const client = (db as any).$client as mysql.Pool

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_config (
        id INT PRIMARY KEY,
        start_date DATETIME,
        end_date DATETIME,
        duration_minutes INT DEFAULT 60,
        admin_pin VARCHAR(50) DEFAULT '1234'
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_db_id INT,
        student_name VARCHAR(255) NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        tasks_json TEXT NOT NULL,
        answers_json TEXT,
        score INT,
        total_questions INT,
        submitted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default config row if absent
    await client.query(`
      INSERT IGNORE INTO test_config (id, duration_minutes, admin_pin)
      VALUES (1, 60, '1234')
    `)

    console.log('[db] MySQL tables initialised')
  } catch (err) {
    console.error('[db] Table initialisation failed:', err)
  }
})
