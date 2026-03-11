import { and, desc, eq } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '../../database'
import { attemptQuestions, testAttempts, tests } from '../../database/schema'
import {
  cidrToSubnetMask,
  compareIps,
  generateRandomCidr,
  generateRandomIp,
  generateRandomSubnetMask,
  getBroadcastAddress,
  getHostCountFromMask,
  getIpClass,
  getNetworkAddress,
  ipToBinary,
  sameNetwork,
} from '../ipv4'
import type { StudentSession } from './auth'

type DateLike = Date | string | null

interface SaveTestInput {
  title: string
  description?: string | null
  startAt: string
  endAt: string
  durationMinutes: number
  maxAttempts: number
  isPublished?: boolean | number
}

interface AttemptAnswerPayload {
  level1?: string[]
  level2?: string[]
  level3?: Array<{ network?: string; broadcast?: string }>
  level4?: string[]
  level5?: string[]
  level6?: Array<{ network?: string; mask?: string; broadcast?: string }>
}

interface QuestionSeed {
  section: string
  questionOrder: number
  contextPrimary?: string | null
  contextSecondary?: string | null
  promptPrimary: string
  promptSecondary?: string | null
  promptTertiary?: string | null
  expectedAnswer1: string
  expectedAnswer2?: string | null
  expectedAnswer3?: string | null
  points: number
}

interface AttemptRow {
  id: number
  testId: number
  studentId: number
  attemptNumber: number
  status: string
  startedAt: DateLike
  deadlineAt: DateLike
  submittedAt: DateLike
  score: number | null
  totalQuestions: number | null
  createdAt: DateLike
}

function toDate(value: DateLike) {
  if (!value) {
    return null
  }

  return value instanceof Date ? value : new Date(value)
}

export function toIsoString(value: DateLike) {
  const parsed = toDate(value)
  return parsed ? parsed.toISOString() : null
}

function parseRequiredDate(value: string, label: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw createError({
      statusCode: 400,
      message: `${label} is invalid`,
    })
  }

  return parsed
}

function validateTestWindow(startAt: Date, endAt: Date, durationMinutes: number) {
  if (endAt <= startAt) {
    throw createError({
      statusCode: 400,
      message: 'End date must be after start date',
    })
  }

  if (durationMinutes < 1) {
    throw createError({
      statusCode: 400,
      message: 'Duration must be at least 1 minute',
    })
  }

  if (new Date(startAt.getTime() + durationMinutes * 60000) > endAt) {
    throw createError({
      statusCode: 400,
      message: 'Start date plus duration cannot be greater than end date',
    })
  }
}

function normalizeTestInput(input: SaveTestInput) {
  const title = input.title.trim()
  const description = input.description?.trim() || null
  const durationMinutes = Number(input.durationMinutes)
  const maxAttempts = Number(input.maxAttempts)

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'Test title is required',
    })
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    throw createError({
      statusCode: 400,
      message: 'Duration must be a positive number',
    })
  }

  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    throw createError({
      statusCode: 400,
      message: 'Max attempts must be at least 1',
    })
  }

  const startAt = parseRequiredDate(input.startAt, 'Start date')
  const endAt = parseRequiredDate(input.endAt, 'End date')

  validateTestWindow(startAt, endAt, durationMinutes)

  return {
    title,
    description,
    startAt,
    endAt,
    durationMinutes,
    maxAttempts,
    isPublished: input.isPublished === false || input.isPublished === 0 ? 0 : 1,
  }
}

function generateLevel1Questions(): QuestionSeed[] {
  const ip = generateRandomIp()

  return [{
    section: 'level1',
    questionOrder: 1,
    promptPrimary: ipToBinary(ip),
    expectedAnswer1: ip,
    points: 1,
  }]
}

function generateLevel2Questions(): QuestionSeed[] {
  const classes = ['A', 'B', 'C']

  return Array.from({ length: 5 }, (_, index) => {
    const classType = classes[Math.floor(Math.random() * classes.length)]
    const ip = generateRandomIp(classType)

    return {
      section: 'level2',
      questionOrder: index + 1,
      promptPrimary: ip,
      expectedAnswer1: getIpClass(ip),
      points: 1,
    }
  })
}

function generateLevel3Questions(): QuestionSeed[] {
  return Array.from({ length: 5 }, (_, index) => {
    const ip = generateRandomIp()
    const cidr = generateRandomCidr(16, 28)

    return {
      section: 'level3',
      questionOrder: index + 1,
      promptPrimary: `${ip}/${cidr}`,
      expectedAnswer1: getNetworkAddress(ip, cidr),
      expectedAnswer2: getBroadcastAddress(ip, cidr),
      points: 2,
    }
  })
}

function generateLevel4Questions(): QuestionSeed[] {
  return Array.from({ length: 5 }, (_, index) => {
    const cidr = Math.floor(Math.random() * 11) + 20
    const mask = cidrToSubnetMask(cidr)

    return {
      section: 'level4',
      questionOrder: index + 1,
      promptPrimary: mask,
      expectedAnswer1: String(getHostCountFromMask(mask)),
      points: 1,
    }
  })
}

function generateLevel5Questions(): QuestionSeed[] {
  return Array.from({ length: 5 }, (_, index) => {
    const ip1 = generateRandomIp()
    const ip2 = generateRandomIp()
    const mask = generateRandomSubnetMask()

    return {
      section: 'level5',
      questionOrder: index + 1,
      promptPrimary: ip1,
      promptSecondary: ip2,
      promptTertiary: mask,
      expectedAnswer1: sameNetwork(ip1, ip2, mask) ? 'Yes' : 'No',
      points: 1,
    }
  })
}

function generateLevel6Questions(): QuestionSeed[] {
  const baseCidr = Math.random() < 0.5 ? 23 : 24
  const firstOctet = Math.floor(Math.random() * 32) + 192
  const secondOctet = Math.floor(Math.random() * 256)
  const thirdOctet = baseCidr === 23 ? Math.floor(Math.random() * 128) * 2 : Math.floor(Math.random() * 256)
  const baseNetwork = `${firstOctet}.${secondOctet}.${thirdOctet}.0`

  const subnetCount = Math.floor(Math.random() * 3) + 3
  const maxHostsPerSubnet = baseCidr === 23 ? 510 : 254

  const subnets = Array.from({ length: subnetCount }, (_, index) => {
    const maxHosts = Math.max(12, Math.floor(maxHostsPerSubnet / subnetCount))
    return {
      name: `Subnet ${index + 1}`,
      hosts: Math.floor(Math.random() * (maxHosts - 10)) + 10,
    }
  }).sort((left, right) => right.hosts - left.hosts)

  let currentNetwork = baseNetwork

  return subnets.map((subnet, index) => {
    const hostBits = Math.ceil(Math.log2(subnet.hosts + 2))
    const subnetCidr = 32 - hostBits
    const networkAddress = currentNetwork
    const broadcastAddress = getBroadcastAddress(networkAddress, subnetCidr)
    const mask = cidrToSubnetMask(subnetCidr)

    const nextOctets = broadcastAddress.split('.').map(Number)
    nextOctets[3] += 1

    for (let currentIndex = 3; currentIndex >= 0; currentIndex -= 1) {
      if (nextOctets[currentIndex] > 255) {
        nextOctets[currentIndex] = 0
        if (currentIndex > 0) {
          nextOctets[currentIndex - 1] += 1
        }
      }
    }

    currentNetwork = nextOctets.join('.')

    return {
      section: 'level6',
      questionOrder: index + 1,
      contextPrimary: baseNetwork,
      contextSecondary: String(baseCidr),
      promptPrimary: subnet.name,
      promptSecondary: String(subnet.hosts),
      expectedAnswer1: networkAddress,
      expectedAnswer2: mask,
      expectedAnswer3: broadcastAddress,
      points: 3,
    }
  })
}

function buildQuestionSeeds() {
  return [
    ...generateLevel1Questions(),
    ...generateLevel2Questions(),
    ...generateLevel3Questions(),
    ...generateLevel4Questions(),
    ...generateLevel5Questions(),
    ...generateLevel6Questions(),
  ]
}

function getSectionAnswer(question: typeof attemptQuestions.$inferSelect, answers: AttemptAnswerPayload) {
  if (question.section === 'level1') {
    return {
      answer1: answers.level1?.[question.questionOrder - 1]?.trim() || null,
      answer2: null,
      answer3: null,
    }
  }

  if (question.section === 'level2') {
    return {
      answer1: answers.level2?.[question.questionOrder - 1]?.trim() || null,
      answer2: null,
      answer3: null,
    }
  }

  if (question.section === 'level3') {
    const row = answers.level3?.[question.questionOrder - 1]
    return {
      answer1: row?.network?.trim() || null,
      answer2: row?.broadcast?.trim() || null,
      answer3: null,
    }
  }

  if (question.section === 'level4') {
    return {
      answer1: answers.level4?.[question.questionOrder - 1]?.trim() || null,
      answer2: null,
      answer3: null,
    }
  }

  if (question.section === 'level5') {
    return {
      answer1: answers.level5?.[question.questionOrder - 1]?.trim() || null,
      answer2: null,
      answer3: null,
    }
  }

  if (question.section === 'level6') {
    const row = answers.level6?.[question.questionOrder - 1]
    return {
      answer1: row?.network?.trim() || null,
      answer2: row?.mask?.trim() || null,
      answer3: row?.broadcast?.trim() || null,
    }
  }

  return {
    answer1: null,
    answer2: null,
    answer3: null,
  }
}

function calculateEarnedPoints(
  question: typeof attemptQuestions.$inferSelect,
  answers: { answer1: string | null; answer2: string | null; answer3: string | null },
) {
  if (question.section === 'level4') {
    return Number(answers.answer1 || '0') === Number(question.expectedAnswer1) ? 1 : 0
  }

  let earned = 0

  if (compareIps(answers.answer1 || '', question.expectedAnswer1)) {
    earned += 1
  }

  if (question.expectedAnswer2 && compareIps(answers.answer2 || '', question.expectedAnswer2)) {
    earned += 1
  }

  if (question.expectedAnswer3 && compareIps(answers.answer3 || '', question.expectedAnswer3)) {
    earned += 1
  }

  return earned
}

async function expireAttemptIfNeeded(attempt: AttemptRow) {
  const deadlineAt = toDate(attempt.deadlineAt)

  if (!deadlineAt || attempt.status !== 'in_progress' || attempt.submittedAt) {
    return attempt
  }

  if (deadlineAt.getTime() > Date.now()) {
    return attempt
  }

  await db
    .update(testAttempts)
    .set({
      status: 'expired',
    })
    .where(eq(testAttempts.id, attempt.id))

  return {
    ...attempt,
    status: 'expired',
  }
}

function getTestState(test: typeof tests.$inferSelect, attemptRows: AttemptRow[]) {
  const now = new Date()
  const startAt = toDate(test.startAt)
  const endAt = toDate(test.endAt)

  if (!startAt || !endAt) {
    return 'invalid'
  }

  if (new Date(startAt.getTime() + test.durationMinutes * 60000) > endAt) {
    return 'invalid'
  }

  const activeAttempt = attemptRows.find(row => row.status === 'in_progress' && !row.submittedAt && toDate(row.deadlineAt)?.getTime()! > now.getTime())

  if (activeAttempt) {
    return 'in_progress'
  }

  if (now < startAt) {
    return 'upcoming'
  }

  if (now > endAt) {
    return 'closed'
  }

  if (attemptRows.length >= test.maxAttempts) {
    return 'attempts_exhausted'
  }

  return 'available'
}

export function buildSections(
  questionRows: Array<typeof attemptQuestions.$inferSelect>,
  includeSolutions: boolean,
) {
  const level1Rows = questionRows.filter(question => question.section === 'level1')
  const level2Rows = questionRows.filter(question => question.section === 'level2')
  const level3Rows = questionRows.filter(question => question.section === 'level3')
  const level4Rows = questionRows.filter(question => question.section === 'level4')
  const level5Rows = questionRows.filter(question => question.section === 'level5')
  const level6Rows = questionRows.filter(question => question.section === 'level6')

  return {
    level1: level1Rows.map(question => ({
      id: question.id,
      binary: question.promptPrimary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level2: level2Rows.map(question => ({
      id: question.id,
      ip: question.promptPrimary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level3: level3Rows.map(question => ({
      id: question.id,
      hostIp: question.promptPrimary,
      studentNetwork: question.studentAnswer1,
      studentBroadcast: question.studentAnswer2,
      correctNetwork: includeSolutions ? question.expectedAnswer1 : null,
      correctBroadcast: includeSolutions ? question.expectedAnswer2 : null,
      earnedPoints: question.earnedPoints,
    })),
    level4: level4Rows.map(question => ({
      id: question.id,
      mask: question.promptPrimary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level5: level5Rows.map(question => ({
      id: question.id,
      ip1: question.promptPrimary,
      ip2: question.promptSecondary,
      mask: question.promptTertiary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level6: {
      baseNetwork: level6Rows[0]?.contextPrimary || '',
      baseCidr: Number(level6Rows[0]?.contextSecondary || '0'),
      subnets: level6Rows.map(question => ({
        id: question.id,
        name: question.promptPrimary,
        hosts: Number(question.promptSecondary || '0'),
        studentNetwork: question.studentAnswer1,
        studentMask: question.studentAnswer2,
        studentBroadcast: question.studentAnswer3,
        correctNetwork: includeSolutions ? question.expectedAnswer1 : null,
        correctMask: includeSolutions ? question.expectedAnswer2 : null,
        correctBroadcast: includeSolutions ? question.expectedAnswer3 : null,
        earnedPoints: question.earnedPoints,
      })),
    },
  }
}

export async function listTestsForAdmin() {
  const testRows = await db
    .select()
    .from(tests)
    .orderBy(desc(tests.createdAt), desc(tests.id))

  const attemptRows = await db
    .select()
    .from(testAttempts)

  return testRows.map(testRow => {
    const rowsForTest = attemptRows.filter(row => row.testId === testRow.id)

    return {
      id: testRow.id,
      title: testRow.title,
      description: testRow.description,
      startAt: toIsoString(testRow.startAt),
      endAt: toIsoString(testRow.endAt),
      durationMinutes: testRow.durationMinutes,
      maxAttempts: testRow.maxAttempts,
      isPublished: Boolean(testRow.isPublished),
      attemptsCount: rowsForTest.length,
      submissionsCount: rowsForTest.filter(row => row.submittedAt).length,
      isInvalid: getTestState(testRow, rowsForTest as AttemptRow[]) === 'invalid',
    }
  })
}

export async function getTestForAdmin(testId: number) {
  const rows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1)

  if (rows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  return {
    id: rows[0].id,
    title: rows[0].title,
    description: rows[0].description,
    startAt: toIsoString(rows[0].startAt),
    endAt: toIsoString(rows[0].endAt),
    durationMinutes: rows[0].durationMinutes,
    maxAttempts: rows[0].maxAttempts,
    isPublished: Boolean(rows[0].isPublished),
  }
}

export async function createTest(input: SaveTestInput) {
  const normalized = normalizeTestInput(input)
  const now = new Date()

  const [inserted] = await db
    .insert(tests)
    .values({
      title: normalized.title,
      description: normalized.description,
      startAt: normalized.startAt,
      endAt: normalized.endAt,
      durationMinutes: normalized.durationMinutes,
      maxAttempts: normalized.maxAttempts,
      isPublished: normalized.isPublished,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId()

  return {
    id: inserted.id,
  }
}

export async function updateTest(testId: number, input: SaveTestInput) {
  const normalized = normalizeTestInput(input)
  const existingRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1)

  if (existingRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  await db
    .update(tests)
    .set({
      title: normalized.title,
      description: normalized.description,
      startAt: normalized.startAt,
      endAt: normalized.endAt,
      durationMinutes: normalized.durationMinutes,
      maxAttempts: normalized.maxAttempts,
      isPublished: normalized.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(tests.id, testId))

  return {
    id: testId,
  }
}

export async function listTestsForStudent(student: StudentSession) {
  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.isPublished, 1))
    .orderBy(desc(tests.startAt), desc(tests.id))

  const rawAttemptRows = await db
    .select()
    .from(testAttempts)
    .where(eq(testAttempts.studentId, student.studentDbId))
    .orderBy(desc(testAttempts.startedAt), desc(testAttempts.id))

  const syncedAttempts: AttemptRow[] = []

  for (const attemptRow of rawAttemptRows) {
    syncedAttempts.push(await expireAttemptIfNeeded(attemptRow as AttemptRow))
  }

  return testRows.map(testRow => {
    const attemptRows = syncedAttempts.filter(row => row.testId === testRow.id)
    const activeAttempt = attemptRows.find(row => row.status === 'in_progress' && !row.submittedAt)
    const latestSubmittedAttempt = attemptRows.find(row => row.submittedAt)
    const status = getTestState(testRow, attemptRows)

    return {
      id: testRow.id,
      title: testRow.title,
      description: testRow.description,
      startAt: toIsoString(testRow.startAt),
      endAt: toIsoString(testRow.endAt),
      durationMinutes: testRow.durationMinutes,
      maxAttempts: testRow.maxAttempts,
      attemptsUsed: attemptRows.length,
      attemptsRemaining: Math.max(0, testRow.maxAttempts - attemptRows.length),
      status,
      activeAttemptId: activeAttempt?.id ?? null,
      latestScore: latestSubmittedAttempt?.score ?? null,
      latestTotalQuestions: latestSubmittedAttempt?.totalQuestions ?? null,
      latestSubmittedAt: toIsoString(latestSubmittedAttempt?.submittedAt ?? null),
    }
  })
}

export async function startTestForStudent(testId: number, student: StudentSession) {
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

  const testRow = testRows[0]

  if (!testRow.isPublished) {
    throw createError({
      statusCode: 403,
      message: 'Test is not published',
    })
  }

  const rawAttemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.testId, testId), eq(testAttempts.studentId, student.studentDbId)))
    .orderBy(desc(testAttempts.startedAt), desc(testAttempts.id))

  const attemptRows: AttemptRow[] = []

  for (const row of rawAttemptRows) {
    attemptRows.push(await expireAttemptIfNeeded(row as AttemptRow))
  }

  const activeAttempt = attemptRows.find(row => row.status === 'in_progress' && !row.submittedAt)

  if (activeAttempt) {
    return {
      attemptId: activeAttempt.id,
      resumed: true,
    }
  }

  const state = getTestState(testRow, attemptRows)

  if (state === 'invalid') {
    throw createError({
      statusCode: 400,
      message: 'This test has an invalid schedule',
    })
  }

  if (state === 'upcoming') {
    throw createError({
      statusCode: 403,
      message: 'This test has not started yet',
    })
  }

  if (state === 'closed') {
    throw createError({
      statusCode: 403,
      message: 'This test is closed',
    })
  }

  if (state === 'attempts_exhausted') {
    throw createError({
      statusCode: 403,
      message: 'No attempts remaining for this test',
    })
  }

  const now = new Date()
  const endAt = toDate(testRow.endAt)!
  const deadlineCandidate = new Date(now.getTime() + testRow.durationMinutes * 60000)
  const deadlineAt = deadlineCandidate < endAt ? deadlineCandidate : endAt
  const [inserted] = await db
    .insert(testAttempts)
    .values({
      testId,
      studentId: student.studentDbId,
      attemptNumber: attemptRows.length + 1,
      status: 'in_progress',
      startedAt: now,
      deadlineAt,
      createdAt: now,
    })
    .$returningId()

  const seeds = buildQuestionSeeds()

  await db
    .insert(attemptQuestions)
    .values(seeds.map(seed => ({
      attemptId: inserted.id,
      section: seed.section,
      questionOrder: seed.questionOrder,
      contextPrimary: seed.contextPrimary ?? null,
      contextSecondary: seed.contextSecondary ?? null,
      promptPrimary: seed.promptPrimary,
      promptSecondary: seed.promptSecondary ?? null,
      promptTertiary: seed.promptTertiary ?? null,
      expectedAnswer1: seed.expectedAnswer1,
      expectedAnswer2: seed.expectedAnswer2 ?? null,
      expectedAnswer3: seed.expectedAnswer3 ?? null,
      points: seed.points,
      createdAt: now,
    })))

  return {
    attemptId: inserted.id,
    resumed: false,
  }
}

export async function getAttemptForStudent(attemptId: number, student: StudentSession) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.id, attemptId), eq(testAttempts.studentId, student.studentDbId)))
    .limit(1)

  if (attemptRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Attempt not found',
    })
  }

  const syncedAttempt = await expireAttemptIfNeeded(attemptRows[0] as AttemptRow)
  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, syncedAttempt.testId))
    .limit(1)

  if (testRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const questionRows = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  const showSolutions = Boolean(syncedAttempt.submittedAt || syncedAttempt.status === 'expired')
  const score = syncedAttempt.score ?? 0
  const totalQuestions = syncedAttempt.totalQuestions ?? questionRows.reduce((sum, question) => sum + question.points, 0)

  return {
    attempt: {
      id: syncedAttempt.id,
      testId: syncedAttempt.testId,
      title: testRows[0].title,
      description: testRows[0].description,
      status: syncedAttempt.status,
      attemptNumber: syncedAttempt.attemptNumber,
      startedAt: toIsoString(syncedAttempt.startedAt),
      deadlineAt: toIsoString(syncedAttempt.deadlineAt),
      submittedAt: toIsoString(syncedAttempt.submittedAt),
      score,
      totalQuestions,
      percentage: totalQuestions ? Math.round((score / totalQuestions) * 100) : 0,
      canSubmit: syncedAttempt.status === 'in_progress' && !syncedAttempt.submittedAt,
    },
    sections: buildSections(questionRows, showSolutions),
  }
}

export async function submitAttemptForStudent(attemptId: number, student: StudentSession, answers: AttemptAnswerPayload) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.id, attemptId), eq(testAttempts.studentId, student.studentDbId)))
    .limit(1)

  if (attemptRows.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Attempt not found',
    })
  }

  const syncedAttempt = await expireAttemptIfNeeded(attemptRows[0] as AttemptRow)

  if (syncedAttempt.status !== 'in_progress' || syncedAttempt.submittedAt) {
    throw createError({
      statusCode: 400,
      message: 'This attempt can no longer be submitted',
    })
  }

  const questionRows = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  let score = 0
  let totalQuestions = 0

  for (const question of questionRows) {
    const studentAnswers = getSectionAnswer(question, answers)
    const earnedPoints = calculateEarnedPoints(question, studentAnswers)

    await db
      .update(attemptQuestions)
      .set({
        studentAnswer1: studentAnswers.answer1,
        studentAnswer2: studentAnswers.answer2,
        studentAnswer3: studentAnswers.answer3,
        earnedPoints,
      })
      .where(eq(attemptQuestions.id, question.id))

    score += earnedPoints
    totalQuestions += question.points
  }

  await db
    .update(testAttempts)
    .set({
      status: 'submitted',
      score,
      totalQuestions,
      submittedAt: new Date(),
    })
    .where(eq(testAttempts.id, attemptId))

  return {
    score,
    totalQuestions,
    percentage: totalQuestions ? Math.round((score / totalQuestions) * 100) : 0,
  }
}
