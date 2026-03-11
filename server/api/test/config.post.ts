import { getDb } from '../../utils/db'
import { testConfig } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { pin, startDate, endDate, durationMinutes } = body

  const db = getDb()
  const rows = await db.select({ adminPin: testConfig.adminPin }).from(testConfig).where(eq(testConfig.id, 1)).limit(1)
  const correctPin = rows[0]?.adminPin || '1234'

  if (pin !== correctPin) {
    throw createError({ statusCode: 403, message: 'Invalid PIN' })
  }

  if (!body.verifyOnly) {
    await db.update(testConfig)
      .set({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        durationMinutes: durationMinutes ?? 60,
      })
      .where(eq(testConfig.id, 1))
  }

  return { success: true }
})
