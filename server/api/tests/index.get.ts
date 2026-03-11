import { getStudentSession, requireAdminSession, requireStudentSession } from '../../utils/service/auth'
import { listTestsForAdmin, listTestsForStudent } from '../../utils/service/tests'

export default defineEventHandler(async (event) => {
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
