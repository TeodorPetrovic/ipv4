import { requireAdminSession } from '../../utils/service/auth'
import { getTestForAdmin } from '../../utils/service/tests'

export default defineEventHandler(async (event) => {
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
