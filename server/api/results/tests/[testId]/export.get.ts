import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { exportResultsForTest } from '#server/utils/service/results'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const testId = Number(getRouterParam(event, 'testId'))

  if (!Number.isFinite(testId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid test ID',
    })
  }

  const { buffer, filename } = await exportResultsForTest(testId)

  setHeader(event, 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'content-disposition', `attachment; filename="${filename}"`)

  return buffer
})
