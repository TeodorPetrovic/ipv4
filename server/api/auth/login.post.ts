import { getDb } from '../../utils/db'
import { students } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, studentId } = body

  if (!name || !studentId) {
    throw createError({ statusCode: 400, message: 'Name and student ID are required' })
  }

  const db = getDb()

  // Find or create the student record
  const existing = await db.select().from(students).where(eq(students.studentId, studentId)).limit(1)
  let student: { id: number; name: string; studentId: string }

  if (existing.length > 0) {
    student = { id: existing[0].id, name: existing[0].name, studentId: existing[0].studentId }
  } else {
    const [inserted] = await db.insert(students).values({ name, studentId, createdAt: new Date() }).$returningId()
    student = { id: inserted.id, name, studentId }
  }

  setCookie(event, 'session', JSON.stringify({ studentDbId: student.id, name: student.name, studentId: student.studentId }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    secure: process.env.NODE_ENV !== 'development',
  })

  return { success: true, student }
})
