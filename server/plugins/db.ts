import mysql from 'mysql2/promise'

import { db } from '../database'

// Create the database and tables on server startup
export default defineNitroPlugin(async () => {
  // First ensure the database exists (connect without specifying a DB)
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
    const dbName = process.env.DB_NAME
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    await conn.end()
  } catch (err) {
    console.error('[db] Could not ensure database exists:', err)
  }

  // Now run DDL via the pool
  try {
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
