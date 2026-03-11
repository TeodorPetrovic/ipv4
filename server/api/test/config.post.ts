import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { pin, startDate, endDate, durationMinutes } = body

  const db = getDb()
  const config = db.prepare('SELECT admin_pin FROM test_config WHERE id = 1').get() as any
  const correctPin = config?.admin_pin || '1234'

  if (pin !== correctPin) {
    throw createError({ statusCode: 403, message: 'Invalid PIN' })
  }

  if (!body.verifyOnly) {
    db.prepare('UPDATE test_config SET start_date = ?, end_date = ?, duration_minutes = ? WHERE id = 1')
      .run(startDate || null, endDate || null, durationMinutes || 60)
  }

  return { success: true }
})
