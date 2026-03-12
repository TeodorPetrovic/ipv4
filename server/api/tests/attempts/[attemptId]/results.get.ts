import { withSafeApi } from '#server/utils/safe-api'
import { requireStudentSession } from '#server/utils/service/auth'
import { getAttemptResultsForStudent } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
  const attemptId = Number(getRouterParam(event, 'attemptId'))

  if (!Number.isFinite(attemptId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid attempt ID',
    })
  }

  const session = requireStudentSession(event)
  return getAttemptResultsForStudent(attemptId, session)
})
