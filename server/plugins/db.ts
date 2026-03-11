import mysql from 'mysql2/promise'

import { db } from '../database'

async function columnExists(client: mysql.Pool, tableName: string, columnName: string) {
  const [rows] = await client.query<mysql.RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [process.env.DB_NAME, tableName, columnName],
  )

  return rows.length > 0
}

export default defineNitroPlugin(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

    if (process.env.DB_NAME) {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``)
    }

    await connection.end()
  } catch (error) {
    console.error('[db] Could not ensure database exists:', error)
  }

  try {
    const client = (db as any).$client as mysql.Pool

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        admin_password VARCHAR(255) NOT NULL
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
      CREATE TABLE IF NOT EXISTS tests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        start_at DATETIME NOT NULL,
        end_at DATETIME NOT NULL,
        duration_minutes INT NOT NULL,
        max_attempts INT NOT NULL,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        test_id INT NOT NULL,
        student_id INT NOT NULL,
        attempt_number INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        started_at DATETIME NOT NULL,
        deadline_at DATETIME NOT NULL,
        submitted_at DATETIME NULL,
        score INT NULL,
        total_questions INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_test_attempts_test_id (test_id),
        INDEX idx_test_attempts_student_id (student_id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS attempt_questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        attempt_id INT NOT NULL,
        section VARCHAR(32) NOT NULL,
        question_order INT NOT NULL,
        context_primary VARCHAR(255) NULL,
        context_secondary VARCHAR(255) NULL,
        prompt_primary VARCHAR(255) NOT NULL,
        prompt_secondary VARCHAR(255) NULL,
        prompt_tertiary VARCHAR(255) NULL,
        expected_answer_1 VARCHAR(255) NOT NULL,
        expected_answer_2 VARCHAR(255) NULL,
        expected_answer_3 VARCHAR(255) NULL,
        student_answer_1 VARCHAR(255) NULL,
        student_answer_2 VARCHAR(255) NULL,
        student_answer_3 VARCHAR(255) NULL,
        points INT NOT NULL,
        earned_points INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attempt_questions_attempt_id (attempt_id)
      )
    `)

    if (!(await columnExists(client, 'app_settings', 'admin_email'))) {
      await client.query(`
        ALTER TABLE app_settings
        ADD COLUMN admin_email VARCHAR(255) NOT NULL DEFAULT 'tpetrovic@singimail.rs'
      `)
    }

    if (!(await columnExists(client, 'app_settings', 'admin_password'))) {
      await client.query(`
        ALTER TABLE app_settings
        ADD COLUMN admin_password VARCHAR(255) NOT NULL DEFAULT '123'
      `)
    }

    if (!(await columnExists(client, 'students', 'created_at'))) {
      await client.query(`
        ALTER TABLE students
        ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `)
    }

    await client.query(`
      INSERT IGNORE INTO app_settings (id, admin_email, admin_password)
      VALUES (1, 'tpetrovic@singimail.rs', '123')
    `)

    console.log('[db] MySQL tables initialised')
  } catch (error) {
    console.error('[db] Table initialisation failed:', error)
  }
})
