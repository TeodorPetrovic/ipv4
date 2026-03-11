import { getDb } from '../../utils/db'
import { testSessions } from '../../db/schema'
import { isNotNull, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = getDb()
  const sessions = await db
    .select()
    .from(testSessions)
    .where(isNotNull(testSessions.submittedAt))
    .orderBy(desc(testSessions.submittedAt))
  return sessions
})
