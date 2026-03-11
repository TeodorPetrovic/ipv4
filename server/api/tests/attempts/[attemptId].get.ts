import { requireStudentSession } from '../../../utils/service/auth'
import { getAttemptForStudent } from '../../../utils/service/tests'

export default defineEventHandler(async (event) => {
  const attemptId = Number(getRouterParam(event, 'attemptId'))

  if (!Number.isFinite(attemptId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid attempt ID',
    })
  }

  const session = requireStudentSession(event)
  return getAttemptForStudent(attemptId, session)
})
