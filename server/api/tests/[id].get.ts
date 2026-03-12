import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { getTestForAdmin } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const testId = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(testId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid test ID',
    })
  }

  return getTestForAdmin(testId)
})
