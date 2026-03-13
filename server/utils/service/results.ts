import { desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '#server/database'
import { attemptQuestions, students, testAttempts, tests } from '#server/database/schema'
import { buildSections, toIsoString } from './tests'

async function buildAttemptResults(
  attemptRows: Array<typeof testAttempts.$inferSelect>,
  options?: {
    studentRows?: Array<typeof students.$inferSelect>
    testRows?: Array<typeof tests.$inferSelect>
  },
) {
  if (attemptRows.length === 0) {
    return []
  }

  const studentRows = options?.studentRows ?? await db.select().from(students)
  const testRows = options?.testRows ?? await db.select().from(tests)

  // Fetch all question rows for all attempts in a single query instead of N queries.
  const attemptIds = attemptRows.map(r => r.id)
  const allQuestionRows = await db
    .select()
    .from(attemptQuestions)
    .where(inArray(attemptQuestions.attemptId, attemptIds))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  // Group question rows by attemptId for O(1) per-attempt lookup.
  const questionsByAttemptId = new Map<number, Array<typeof attemptQuestions.$inferSelect>>()
  for (const row of allQuestionRows) {
    const list = questionsByAttemptId.get(row.attemptId)
    if (list) {
      list.push(row)
    } else {
      questionsByAttemptId.set(row.attemptId, [row])
    }
  }

  const results = []

  for (const attemptRow of attemptRows) {
    const questionRows = questionsByAttemptId.get(attemptRow.id) ?? []
    const studentRow = studentRows.find(row => row.id === attemptRow.studentId)
    const testRow = testRows.find(row => row.id === attemptRow.testId)
    const score = attemptRow.score
    const totalQuestions = attemptRow.totalQuestions ?? questionRows.reduce((sum, question) => sum + question.points, 0)

    results.push({
      id: attemptRow.id,
      testId: attemptRow.testId,
      studentName: studentRow?.name || `Student ${studentRow?.studentId || ''}`.trim(),
      studentId: studentRow?.studentId || '',
      testTitle: testRow?.title || 'Untitled test',
      status: attemptRow.status,
      attemptNumber: attemptRow.attemptNumber,
      score,
      totalQuestions,
      percentage: score !== null && totalQuestions ? Math.round((score / totalQuestions) * 100) : null,
      submittedAt: toIsoString(attemptRow.submittedAt),
      startedAt: toIsoString(attemptRow.startedAt),
      deadlineAt: toIsoString(attemptRow.deadlineAt),
      sections: buildSections(questionRows, true),
    })
  }

  return results
}

export async function getSubmittedResults() {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(isNotNull(testAttempts.submittedAt))
    .orderBy(desc(testAttempts.submittedAt), desc(testAttempts.id))

  return buildAttemptResults(attemptRows)
}

export async function getResultByAttemptId(attemptId: number) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.id, attemptId))
    .limit(1)

  const [attemptRow] = attemptRows

  if (!attemptRow) {
    throw createError({
      statusCode: 404,
      message: 'Attempt not found',
    })
  }

  const results = await buildAttemptResults([attemptRow])
  const [result] = results

  if (!result) {
    throw createError({
      statusCode: 404,
      message: 'Attempt result not found',
    })
  }

  return result
}

export async function getResultsByStudentId(studentDbId: number) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.studentId, studentDbId))
    .orderBy(desc(testAttempts.submittedAt), desc(testAttempts.id))

  return buildAttemptResults(attemptRows)
}
