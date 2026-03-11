import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  const config = db.prepare('SELECT * FROM test_config WHERE id = 1').get() as any
  return config || { start_date: null, end_date: null, duration_minutes: 60 }
})
