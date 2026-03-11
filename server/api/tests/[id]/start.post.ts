import { requireStudentSession } from '../../../utils/service/auth'
import { startTestForStudent } from '../../../utils/service/tests'

export default defineEventHandler(async (event) => {
  const testId = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(testId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid test ID',
    })
  }

  const session = requireStudentSession(event)
  return startTestForStudent(testId, session)
})
