import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { listStudents } from '#server/utils/service/students'

export default withSafeApi(async (event) => {
  requireAdminSession(event)
  return listStudents()
})
