import { loginStudent, setStudentSession } from '../../utils/service/auth'

export default defineEventHandler(async (event) => {
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
