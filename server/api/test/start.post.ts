import type { StudentSession } from '../../utils/service/test'
import { createTestSession } from '../../utils/service/test'

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'session')
  if (!sessionCookie) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const session = JSON.parse(sessionCookie) as StudentSession
  return createTestSession(session)
})
