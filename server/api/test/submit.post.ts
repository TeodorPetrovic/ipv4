import { submitTestAnswers } from '../../utils/service/test'

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'session')
  if (!sessionCookie) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const body = await readBody(event)
  return submitTestAnswers(body.sessionId, body.answers)
})
