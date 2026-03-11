import { requireAdminSession } from '../../utils/service/auth'
import { createStudent } from '../../utils/service/students'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const body = await readBody<{ studentId?: string; name?: string }>(event)
  return createStudent({
    studentId: body.studentId || '',
    name: body.name,
  })
})
