import { withSafeApi } from '#server/utils/safe-api'
import { getStudentSession, requireAdminSession, requireStudentSession } from '#server/utils/service/auth'
import { listTestsForAdmin, listTestsForStudent } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
  const query = getQuery(event)

  if (query.mode === 'admin') {
    requireAdminSession(event)
    return listTestsForAdmin()
  }

  const session = getStudentSession(event)

  if (session) {
    return listTestsForStudent(session)
  }

  const requiredStudent = requireStudentSession(event)
  return listTestsForStudent(requiredStudent)
})
