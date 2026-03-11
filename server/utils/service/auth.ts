import { eq } from 'drizzle-orm'

import { db } from '../../database'
import { students } from '../../database/schema'

export async function findOrCreateStudent(name: string, studentId: string) {
  const existing = await db
    .select()
    .from(students)
    .where(eq(students.studentId, studentId))
    .limit(1)

  if (existing.length > 0) {
    return {
      id: existing[0].id,
      name: existing[0].name,
      studentId: existing[0].studentId,
    }
  }

  const [inserted] = await db
    .insert(students)
    .values({
      name,
      studentId,
      createdAt: new Date(),
    })
    .$returningId()

  return { id: inserted.id, name, studentId }
}
