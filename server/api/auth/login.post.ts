import { findOrCreateStudent } from '../../utils/service/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, studentId } = body

  if (!name || !studentId) {
    throw createError({ statusCode: 400, message: 'Name and student ID are required' })
  }

  const student = await findOrCreateStudent(name, studentId)

  setCookie(event, 'session', JSON.stringify({ studentDbId: student.id, name: student.name, studentId: student.studentId }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    secure: process.env.NODE_ENV !== 'development',
  })

  return { success: true, student }
})
