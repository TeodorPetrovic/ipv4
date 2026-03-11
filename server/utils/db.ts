import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  const dataDir = join(process.cwd(), 'data')
  mkdirSync(dataDir, { recursive: true })

  _db = new Database(join(dataDir, 'ipv4.db'))

  _db.exec(`
    CREATE TABLE IF NOT EXISTS test_config (
      id INTEGER PRIMARY KEY,
      start_date TEXT,
      end_date TEXT,
      duration_minutes INTEGER DEFAULT 60,
      admin_pin TEXT DEFAULT '1234'
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_db_id INTEGER REFERENCES students(id),
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      tasks_json TEXT NOT NULL,
      answers_json TEXT,
      score INTEGER,
      total_questions INTEGER,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO test_config (id, start_date, end_date, duration_minutes, admin_pin)
    VALUES (1, NULL, NULL, 60, '1234');
  `)

  return _db
}
