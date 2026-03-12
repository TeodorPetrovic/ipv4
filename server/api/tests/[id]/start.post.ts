import { withSafeApi } from '#server/utils/safe-api'
import { requireStudentSession } from '#server/utils/service/auth'
import { startTestForStudent } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
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
