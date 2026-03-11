import { requireAdminSession } from '../../../utils/service/auth'
import { getResultsForTest } from '../../../utils/service/results'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const testId = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(testId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid test ID',
    })
  }

  return getResultsForTest(testId)
})
