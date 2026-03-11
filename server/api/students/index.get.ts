import { requireAdminSession } from '../../utils/service/auth'
import { listStudents } from '../../utils/service/students'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  return listStudents()
})
