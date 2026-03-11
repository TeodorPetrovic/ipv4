import { getDb } from '../../utils/db'
import { testConfig } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = getDb()
  const rows = await db.select().from(testConfig).where(eq(testConfig.id, 1)).limit(1)
  const config = rows[0]
  return config || { startDate: null, endDate: null, durationMinutes: 60 }
})
