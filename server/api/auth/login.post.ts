import { withSafeApi } from '#server/utils/safe-api'
import { loginStudent, setStudentSession } from '#server/utils/service/auth'

export default withSafeApi(async (event) => {
  const body = await readBody<{ studentId?: string }>(event)
  const student = await loginStudent(body.studentId || '')

  setStudentSession(event, {
    studentDbId: student.id,
    studentId: student.studentId,
    name: student.name,
  })

  return {
    success: true,
    student,
  }
})
