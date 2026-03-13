import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { getResultByAttemptId } from '#server/utils/service/results'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const attemptId = Number(getRouterParam(event, 'attemptId'))

  if (!Number.isFinite(attemptId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid attempt ID',
    })
  }

  return getResultByAttemptId(attemptId)
})
