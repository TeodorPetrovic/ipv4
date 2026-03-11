import { requireAdminSession } from '../../utils/service/auth'
import { updateStudent } from '../../utils/service/students'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const studentIdParam = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(studentIdParam)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid student ID',
    })
  }

  const body = await readBody<{ studentId?: string; name?: string }>(event)
  return updateStudent(studentIdParam, {
    studentId: body.studentId || '',
    name: body.name,
  })
})
