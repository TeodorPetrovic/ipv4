import { withSafeApi } from '#server/utils/safe-api'
import { requireStudentSession } from '#server/utils/service/auth'
import { submitAttemptForStudent } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
  const attemptId = Number(getRouterParam(event, 'attemptId'))

  if (!Number.isFinite(attemptId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid attempt ID',
    })
  }

  const session = requireStudentSession(event)
  const body = await readBody<{ answers?: Record<string, unknown> }>(event)
  const answers = (body?.answers ?? {}) as Record<string, unknown>

  return submitAttemptForStudent(attemptId, session, answers as any)
})
