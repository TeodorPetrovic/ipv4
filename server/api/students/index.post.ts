import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { createStudent } from '#server/utils/service/students'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const body = await readBody<{ studentId?: string; name?: string }>(event)
  return createStudent({
    studentId: body.studentId || '',
    name: body.name,
  })
})
