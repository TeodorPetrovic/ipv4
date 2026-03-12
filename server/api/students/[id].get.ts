import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { getStudent } from '#server/utils/service/students'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const studentId = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(studentId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid student ID',
    })
  }

  return getStudent(studentId)
})
