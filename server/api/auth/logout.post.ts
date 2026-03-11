import { clearAdminSession, clearStudentSession } from '../../utils/service/auth'

export default defineEventHandler((event) => {
  clearStudentSession(event)
  clearAdminSession(event)

  return {
    success: true,
  }
})
