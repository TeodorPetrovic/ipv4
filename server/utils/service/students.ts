import { desc, eq } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '../../database'
import { students, testAttempts } from '../../database/schema'

interface SaveStudentInput {
  studentId: string
  name?: string | null
}

function normalizeStudentName(studentId: string, name?: string | null) {
  const normalizedName = name?.trim()
  return normalizedName || `Student ${studentId}`
}

async function ensureStudentIdAvailable(studentId: string, ignoreStudentId?: number) {
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.studentId, studentId))
    .orderBy(desc(students.id))

  const conflictingRow = rows.find(row => row.id !== ignoreStudentId)

  if (conflictingRow) {
    throw createError({
      statusCode: 400,
      message: 'Student ID already exists',
    })
  }
}

export async function listStudents() {
  const studentRows = await db
    .select()
    .from(students)
    .orderBy(desc(students.createdAt), desc(students.id))

  const attemptRows = await db
    .select({
      id: testAttempts.id,
      studentId: testAttempts.studentId,
    })
    .from(testAttempts)

  return studentRows.map(student => ({
    id: student.id,
    studentId: student.studentId,
    name: student.name,
    createdAt: student.createdAt,
    attemptsCount: attemptRows.filter(row => row.studentId === student.id).length,
  }))
}

export async function getStudent(studentDbId: number) {
  const rows = await db
    .select()
    .from(students)
    .where(eq(students.id, studentDbId))
    .limit(1)

  if (rows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Student not found',
    })
  }

  return {
    id: rows[0].id,
    studentId: rows[0].studentId,
    name: rows[0].name,
    createdAt: rows[0].createdAt,
  }
}

export async function createStudent(input: SaveStudentInput) {
  const studentId = input.studentId.trim()

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: 'Student ID is required',
    })
  }

  await ensureStudentIdAvailable(studentId)

  const name = normalizeStudentName(studentId, input.name)
  const [inserted] = await db
    .insert(students)
    .values({
      studentId,
      name,
      createdAt: new Date(),
    })
    .$returningId()

  return {
    id: inserted.id,
    studentId,
    name,
  }
}

export async function updateStudent(studentDbId: number, input: SaveStudentInput) {
  const studentId = input.studentId.trim()

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: 'Student ID is required',
    })
  }

  await ensureStudentIdAvailable(studentId, studentDbId)

  const existingRows = await db
    .select()
    .from(students)
    .where(eq(students.id, studentDbId))
    .limit(1)

  if (existingRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Student not found',
    })
  }

  const name = normalizeStudentName(studentId, input.name)

  await db
    .update(students)
    .set({
      studentId,
      name,
    })
    .where(eq(students.id, studentDbId))

  return {
    id: studentDbId,
    studentId,
    name,
  }
}
