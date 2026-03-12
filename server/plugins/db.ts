import mysql from 'mysql2/promise'

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
    console.log('[db] Database ensured')
  } catch (error) {
    console.error('[db] Could not ensure database exists:', error)
  }
})
