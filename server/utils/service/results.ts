import { desc, isNotNull } from 'drizzle-orm'

import { db } from '../../database'
import { testSessions } from '../../database/schema'

export async function getSubmittedResults() {
  return db
    .select()
    .from(testSessions)
    .where(isNotNull(testSessions.submittedAt))
    .orderBy(desc(testSessions.submittedAt))
}
