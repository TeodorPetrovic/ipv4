import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../db/schema'

export type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | null = null

export function getDb(): Db {
  if (_db) return _db

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ipv4_test',
    waitForConnections: true,
    connectionLimit: 10,
  })

  _db = drizzle(pool, { schema, mode: 'default' })
  return _db
}
