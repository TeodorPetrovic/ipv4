import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, studentId } = body

  if (!name || !studentId) {
    throw createError({ statusCode: 400, message: 'Name and student ID are required' })
  }

  const db = getDb()

  let student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId) as any
  if (!student) {
    const result = db.prepare('INSERT INTO students (name, student_id) VALUES (?, ?)').run(name, studentId)
    student = { id: result.lastInsertRowid, name, student_id: studentId }
  }

  setCookie(event, 'session', JSON.stringify({ studentDbId: student.id, name: student.name, studentId: student.student_id }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })

  return { success: true, student: { id: student.id, name: student.name, studentId: student.student_id } }
})
