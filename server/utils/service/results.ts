import { desc, eq, isNotNull } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '../../database'
import { attemptQuestions, students, testAttempts, tests } from '../../database/schema'
import { buildSections, toIsoString } from './tests'

async function buildAttemptResults(
  attemptRows: Array<typeof testAttempts.$inferSelect>,
  options?: {
    studentRows?: Array<typeof students.$inferSelect>
    testRows?: Array<typeof tests.$inferSelect>
  },
) {
  const studentRows = options?.studentRows ?? await db.select().from(students)
  const testRows = options?.testRows ?? await db.select().from(tests)

  const results = []

  for (const attemptRow of attemptRows) {
    const questionRows = await db
      .select()
      .from(attemptQuestions)
      .where(eq(attemptQuestions.attemptId, attemptRow.id))
      .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

    const studentRow = studentRows.find(row => row.id === attemptRow.studentId)
    const testRow = testRows.find(row => row.id === attemptRow.testId)
    const score = attemptRow.score
    const totalQuestions = attemptRow.totalQuestions ?? questionRows.reduce((sum, question) => sum + question.points, 0)

    results.push({
      id: attemptRow.id,
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

export async function getResultsForTest(testId: number) {
  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1)

  if (testRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.testId, testId))
    .orderBy(desc(testAttempts.startedAt), desc(testAttempts.id))

  const studentRows = await db
    .select()
    .from(students)

  return {
    test: {
      id: testRows[0].id,
      title: testRows[0].title,
    },
    results: await buildAttemptResults(attemptRows, {
      studentRows,
      testRows,
    }),
  }
}
