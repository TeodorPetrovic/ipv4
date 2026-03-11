import { requireAdminSession } from '../../utils/service/auth'
import { getStudent } from '../../utils/service/students'

export default defineEventHandler(async (event) => {
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
