import { withSafeApi } from '#server/utils/safe-api'
import { clearAdminSession, clearStudentSession } from '#server/utils/service/auth'

export default withSafeApi((event) => {
  clearStudentSession(event)
  clearAdminSession(event)

  return {
    success: true,
  }
})
