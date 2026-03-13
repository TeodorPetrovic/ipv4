import { and, desc, eq, sql } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '#server/database'
import { attemptQuestions, testAttempts, tests } from '#server/database/schema'
import {
  cidrToSubnetMask,
  compareIps,
  generateRandomCidr,
  generateRandomIp,
  getBroadcastAddress,
  getHostCountFromMask,
  getIpClass,
  getNetworkAddress,
  ipToBinary,
} from '../ipv4'
import { generateLevel6QuestionSeeds } from '../level6-generator'
import type { StudentSession } from '#server/utils/service/auth'
import { getScoringSettings } from '#server/utils/service/settings'
import type { ScoringSettings } from '#server/utils/service/settings'

type DateLike = Date | string | null

interface SaveTestInput {
  title: string
  startAt: string
  endAt: string
  durationMinutes: number
  maxAttempts: number
  isPublished?: boolean | number
  testPoints?: number
  unlimitedDuration?: boolean
  unlimitedAttempts?: boolean
}

interface TestMeta {
  testPoints: number
  unlimitedDuration: boolean
  unlimitedAttempts: boolean
}

const DEFAULT_TEST_META: TestMeta = {
  testPoints: 100,
  unlimitedDuration: false,
  unlimitedAttempts: false,
}

interface AttemptAnswerPayload {
  level1?: string[]
  level2?: string[]
  level3?: Array<{ network?: string; broadcast?: string }>
  level4?: string[]
  level5?: string[]
  level6?: string[]
  level7?: Array<{ network?: string; mask?: string; broadcast?: string }>
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
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }

  return fallback
}

function getTestMeta(testRow: typeof tests.$inferSelect): TestMeta {
  return {
    testPoints: testRow.testPoints ?? DEFAULT_TEST_META.testPoints,
    unlimitedDuration: Boolean(testRow.unlimitedDuration),
    unlimitedAttempts: Boolean(testRow.unlimitedAttempts),
  }
}

function normalizeTestInput(input: SaveTestInput) {
  const title = input.title.trim()
  const durationMinutes = Number(input.durationMinutes)
  const requestedMaxAttempts = Number(input.maxAttempts)
  const requestedTestPoints = Number(input.testPoints ?? DEFAULT_TEST_META.testPoints)
  const testPoints = Number.isFinite(requestedTestPoints) ? Math.max(1, Math.round(requestedTestPoints)) : DEFAULT_TEST_META.testPoints
  const unlimitedDuration = parseBoolean(input.unlimitedDuration, false)
  const unlimitedAttempts = parseBoolean(input.unlimitedAttempts, false)

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

  const startAt = parseRequiredDate(input.startAt, 'Start date')
  const endAt = parseRequiredDate(input.endAt, 'End date')

  validateTestWindow(startAt, endAt, durationMinutes)

  if (!unlimitedDuration && new Date(startAt.getTime() + durationMinutes * 60000) > endAt) {
    throw createError({
      statusCode: 400,
      message: 'Start date plus duration cannot be greater than end date',
    })
  }

  const maxAttempts = unlimitedAttempts
    ? 2147483647
    : Math.max(1, Math.round(Number.isFinite(requestedMaxAttempts) ? requestedMaxAttempts : 1))

  return {
    title,
    startAt,
    endAt,
    durationMinutes,
    maxAttempts,
    isPublished: 1,
    testPoints,
    unlimitedDuration: unlimitedDuration ? 1 : 0,
    unlimitedAttempts: unlimitedAttempts ? 1 : 0,
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
  const classes = ['A', 'B', 'C', 'D', 'E']

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
  const privateIp = () => {
    const variant = Math.floor(Math.random() * 3)

    if (variant === 0) {
      return `${10}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
    }

    if (variant === 1) {
      return `${172}.${Math.floor(Math.random() * 16) + 16}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
    }

    return `${192}.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
  }

  // At most ~15% of the class A–C range is private/reserved, so a public IP
  // is found on average within 2 tries. 200 attempts is a very safe upper bound.
  const MAX_PUBLIC_IP_ATTEMPTS = 200

  const publicIp = () => {
    for (let i = 0; i < MAX_PUBLIC_IP_ATTEMPTS; i++) {
      const ip = generateRandomIp()
      const [first = 0, second = 0] = ip.split('.').map(Number)
      const isPrivate = first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
      const isReserved = first === 127 || first === 0 || first >= 224 || (first === 169 && second === 254)
      if (!isPrivate && !isReserved) {
        return ip
      }
    }
    return '8.8.8.8'
  }

  const isUsablePublicHost = (cidrIp: string) => {
    const [ip = '', cidrRaw = '30'] = cidrIp.split('/')
    const cidr = Number(cidrRaw)
    const network = getNetworkAddress(ip, cidr)
    const broadcast = getBroadcastAddress(ip, cidr)
    const [first = 0, second = 0] = ip.split('.').map(Number)
    const isPrivate = first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
    const isReserved = first === 127 || first === 0 || first >= 224 || (first === 169 && second === 254)

    return !isPrivate && !isReserved && ip !== network && ip !== broadcast
  }

  return Array.from({ length: 5 }, (_, index) => {
    const isPublicCandidate = index % 2 === 0
    const ip = isPublicCandidate
      ? publicIp()
      : privateIp()
    const cidrIp = `${ip}/30`

    return {
      section: 'level5',
      questionOrder: index + 1,
      promptPrimary: cidrIp,
      expectedAnswer1: isUsablePublicHost(cidrIp) ? '1' : '0',
      points: 1,
    }
  })
}

function generateLevel6Questions(): QuestionSeed[] {
  return generateLevel6QuestionSeeds(5)
}

function generateLevel7Questions(): QuestionSeed[] {
  const baseNetwork = '105.97.14.0'
  const baseCidr = 24
  const requirements = [39, 21, 7, 6, 6]

  let currentNetwork = baseNetwork

  return requirements.map((hosts, index) => {
    const hostBits = Math.ceil(Math.log2(hosts + 2))
    const subnetCidr = 32 - hostBits
    const networkAddress = currentNetwork
    const broadcastAddress = getBroadcastAddress(networkAddress, subnetCidr)
    const mask = cidrToSubnetMask(subnetCidr)

    const [octet0 = 0, octet1 = 0, octet2 = 0, octet3 = 0] = broadcastAddress.split('.').map(Number)
    const nextOctets = [octet0, octet1, octet2, octet3]
    nextOctets[3] = (nextOctets[3] ?? 0) + 1

    for (let currentIndex = 3; currentIndex >= 0; currentIndex -= 1) {
      if ((nextOctets[currentIndex] ?? 0) > 255) {
        nextOctets[currentIndex] = 0
        if (currentIndex > 0) {
          nextOctets[currentIndex - 1] = (nextOctets[currentIndex - 1] ?? 0) + 1
        }
      }
    }

    currentNetwork = nextOctets.join('.')

    return {
      section: 'level7',
      questionOrder: index + 1,
      contextPrimary: baseNetwork,
      contextSecondary: String(baseCidr),
      promptPrimary: `Subnet ${index + 1}`,
      promptSecondary: String(hosts),
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
    ...generateLevel7Questions(),
  ]
}

function pointsForSection(section: string, settings: ScoringSettings) {
  if (section === 'level1') return settings.level1
  if (section === 'level2') return settings.level2
  if (section === 'level3') return settings.level3
  if (section === 'level4') return settings.level4
  if (section === 'level5') return settings.level5
  if (section === 'level6') return settings.level6
  if (section === 'level7') return settings.level7
  return 0
}

function calculateCorrectnessRatio(
  question: typeof attemptQuestions.$inferSelect,
  answers: { answer1: string | null; answer2: string | null; answer3: string | null },
) {
  if (question.section === 'level4') {
    return Number(answers.answer1 || '0') === Number(question.expectedAnswer1) ? 1 : 0
  }

  let correctParts = 0
  let totalParts = 1

  if (compareIps(answers.answer1 || '', question.expectedAnswer1)) {
    correctParts += 1
  }

  if (question.expectedAnswer2) {
    totalParts += 1
  }

  if (question.expectedAnswer2 && compareIps(answers.answer2 || '', question.expectedAnswer2)) {
    correctParts += 1
  }

  if (question.expectedAnswer3) {
    totalParts += 1
  }

  if (question.expectedAnswer3 && compareIps(answers.answer3 || '', question.expectedAnswer3)) {
    correctParts += 1
  }

  return correctParts / totalParts
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
    return {
      answer1: answers.level6?.[question.questionOrder - 1]?.trim() || null,
      answer2: null,
      answer3: null,
    }
  }

  if (question.section === 'level7') {
    return {
      answer1: answers.level7?.[question.questionOrder - 1]?.network?.trim() || null,
      answer2: answers.level7?.[question.questionOrder - 1]?.mask?.trim() || null,
      answer3: answers.level7?.[question.questionOrder - 1]?.broadcast?.trim() || null,
    }
  }

  return {
    answer1: null,
    answer2: null,
    answer3: null,
  }
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

function getTestState(test: typeof tests.$inferSelect, attemptRows: AttemptRow[], meta: TestMeta) {
  const now = new Date()
  const startAt = toDate(test.startAt)
  const endAt = toDate(test.endAt)

  if (!startAt || !endAt) {
    return 'invalid'
  }

  if (!meta.unlimitedDuration && new Date(startAt.getTime() + test.durationMinutes * 60000) > endAt) {
    return 'invalid'
  }

  const activeAttempt = attemptRows.find((row) => {
    const deadlineAt = toDate(row.deadlineAt)
    return row.status === 'in_progress' && !row.submittedAt && Boolean(deadlineAt && deadlineAt.getTime() > now.getTime())
  })

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

function hasEnoughTimeForFullAttempt(test: typeof tests.$inferSelect, meta: TestMeta) {
  if (meta.unlimitedDuration) {
    return true
  }

  const endAt = toDate(test.endAt)

  if (!endAt) {
    return false
  }

  const now = new Date()
  const requiredEnd = new Date(now.getTime() + test.durationMinutes * 60000)

  return requiredEnd <= endAt
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
  const level7Rows = questionRows.filter(question => question.section === 'level7')

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
      addressCidr: question.promptPrimary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level6: level6Rows.map(question => ({
      id: question.id,
      ip1: question.promptPrimary,
      ip2: question.promptSecondary,
      mask: question.promptTertiary,
      studentAnswer: question.studentAnswer1,
      correctAnswer: includeSolutions ? question.expectedAnswer1 : null,
      earnedPoints: question.earnedPoints,
    })),
    level7: {
      baseNetwork: level7Rows[0]?.contextPrimary || '',
      baseCidr: Number(level7Rows[0]?.contextSecondary || '0'),
      subnets: level7Rows.map(question => ({
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
    const meta = getTestMeta(testRow)

    return {
      id: testRow.id,
      title: testRow.title,
      startAt: toIsoString(testRow.startAt),
      endAt: toIsoString(testRow.endAt),
      durationMinutes: testRow.durationMinutes,
      maxAttempts: testRow.maxAttempts,
      isPublished: Boolean(testRow.isPublished),
      testPoints: meta.testPoints,
      unlimitedDuration: meta.unlimitedDuration,
      unlimitedAttempts: meta.unlimitedAttempts,
      attemptsCount: rowsForTest.length,
      submissionsCount: rowsForTest.filter(row => row.submittedAt).length,
      isInvalid: getTestState(testRow, rowsForTest as AttemptRow[], meta) === 'invalid',
    }
  })
}

export async function getTestForAdmin(testId: number) {
  const rows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1)

  const [testRow] = rows

  if (!testRow) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const meta = getTestMeta(testRow)

  return {
    id: testRow.id,
    title: testRow.title,
    startAt: toIsoString(testRow.startAt),
    endAt: toIsoString(testRow.endAt),
    durationMinutes: testRow.durationMinutes,
    maxAttempts: testRow.maxAttempts,
    isPublished: Boolean(testRow.isPublished),
    testPoints: meta.testPoints,
    unlimitedDuration: meta.unlimitedDuration,
    unlimitedAttempts: meta.unlimitedAttempts,
  }
}

export async function createTest(input: SaveTestInput) {
  const normalized = normalizeTestInput(input)
  const now = new Date()

  const [inserted] = await db
    .insert(tests)
    .values({
      title: normalized.title,
      startAt: normalized.startAt,
      endAt: normalized.endAt,
      durationMinutes: normalized.durationMinutes,
      maxAttempts: normalized.maxAttempts,
      isPublished: normalized.isPublished,
      testPoints: normalized.testPoints,
      unlimitedDuration: normalized.unlimitedDuration,
      unlimitedAttempts: normalized.unlimitedAttempts,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId()

  if (!inserted) {
    throw createError({
      statusCode: 500,
      message: 'Unable to create test',
    })
  }

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
      startAt: normalized.startAt,
      endAt: normalized.endAt,
      durationMinutes: normalized.durationMinutes,
      maxAttempts: normalized.maxAttempts,
      isPublished: normalized.isPublished,
      testPoints: normalized.testPoints,
      unlimitedDuration: normalized.unlimitedDuration,
      unlimitedAttempts: normalized.unlimitedAttempts,
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

  return testRows
    .map(testRow => {
    const attemptRows = syncedAttempts.filter(row => row.testId === testRow.id)
    const meta = getTestMeta(testRow)
    const activeAttempt = attemptRows.find(row => row.status === 'in_progress' && !row.submittedAt)
    const status = getTestState(testRow, attemptRows, meta)
    const cannotFitDurationWindow = !hasEnoughTimeForFullAttempt(testRow, meta)
    const shouldHideForStudent = status === 'invalid'
      || status === 'attempts_exhausted'
      || status === 'closed'
      || status === 'upcoming'
      || (cannotFitDurationWindow && !activeAttempt)

    if (shouldHideForStudent) {
      return null
    }

    return {
      id: testRow.id,
      title: testRow.title,
      activeAttemptId: activeAttempt?.id ?? null,
    }
    })
    .filter(testRow => testRow !== null)
}

export async function startTestForStudent(testId: number, student: StudentSession) {
  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1)

  const [testRow] = testRows

  if (!testRow) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const meta = getTestMeta(testRow)

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

  const state = getTestState(testRow, attemptRows, meta)

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

  if (!hasEnoughTimeForFullAttempt(testRow, meta)) {
    throw createError({
      statusCode: 403,
      message: 'Not enough time remaining to start this test',
    })
  }

  const now = new Date()
  const endAt = toDate(testRow.endAt)!
  const deadlineAt = meta.unlimitedDuration
    ? endAt
    : (() => {
      const deadlineCandidate = new Date(now.getTime() + testRow.durationMinutes * 60000)
      return deadlineCandidate < endAt ? deadlineCandidate : endAt
    })()
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

  if (!inserted) {
    throw createError({
      statusCode: 500,
      message: 'Unable to start test attempt',
    })
  }

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

export async function getAttemptResultsForStudent(attemptId: number, student: StudentSession) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.id, attemptId), eq(testAttempts.studentId, student.studentDbId)))
    .limit(1)

  const [attemptRow] = attemptRows

  if (!attemptRow) {
    throw createError({ statusCode: 404, message: 'Attempt not found' })
  }

  const syncedAttempt = await expireAttemptIfNeeded(attemptRow as AttemptRow)

  if (syncedAttempt.status !== 'submitted' && syncedAttempt.status !== 'expired') {
    throw createError({ statusCode: 403, message: 'Results are not available yet' })
  }

  const testRows = await db.select().from(tests).where(eq(tests.id, syncedAttempt.testId)).limit(1)
  const [testRow] = testRows

  if (!testRow) {
    throw createError({ statusCode: 404, message: 'Test not found' })
  }

  const testMeta = getTestMeta(testRow)

  const questionRows = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  const score = syncedAttempt.score ?? 0
  const totalQuestions = syncedAttempt.totalQuestions ?? testMeta.testPoints

  return {
    attempt: {
      id: syncedAttempt.id,
      testId: syncedAttempt.testId,
      title: testRow.title,
      description: testRow.description,
      status: syncedAttempt.status,
      attemptNumber: syncedAttempt.attemptNumber,
      startedAt: toIsoString(syncedAttempt.startedAt),
      submittedAt: toIsoString(syncedAttempt.submittedAt),
      score,
      totalQuestions,
      percentage: totalQuestions ? Math.round((score / totalQuestions) * 100) : 0,
    },
    sections: buildSections(questionRows, true),
  }
}

export async function getAttemptForStudent(attemptId: number, student: StudentSession) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.id, attemptId), eq(testAttempts.studentId, student.studentDbId)))
    .limit(1)

  const [attemptRow] = attemptRows

  if (!attemptRow) {
    throw createError({
      statusCode: 404,
      message: 'Attempt not found',
    })
  }

  const syncedAttempt = await expireAttemptIfNeeded(attemptRow as AttemptRow)

  if (syncedAttempt.status !== 'in_progress' || syncedAttempt.submittedAt) {
    throw createError({
      statusCode: 403,
      message: 'This attempt is completed and no longer available',
    })
  }

  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, syncedAttempt.testId))
    .limit(1)

  const [testRow] = testRows

  if (!testRow) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const testMeta = getTestMeta(testRow)

  const questionRows = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  const score = syncedAttempt.score ?? 0
  const totalQuestions = syncedAttempt.totalQuestions
    ?? testMeta.testPoints

  return {
    attempt: {
      id: syncedAttempt.id,
      testId: syncedAttempt.testId,
      title: testRow.title,
      description: testRow.description,
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
    sections: buildSections(questionRows, false),
  }
}

export async function submitAttemptForStudent(attemptId: number, student: StudentSession, answers: AttemptAnswerPayload = {}) {
  const attemptRows = await db
    .select()
    .from(testAttempts)
    .where(and(eq(testAttempts.id, attemptId), eq(testAttempts.studentId, student.studentDbId)))
    .limit(1)

  const [attemptRow] = attemptRows

  if (!attemptRow) {
    throw createError({
      statusCode: 404,
      message: 'Attempt not found',
    })
  }

  const alreadyDone = attemptRow.submittedAt
    || (attemptRow.status !== 'in_progress' && attemptRow.status !== 'expired')
  if (alreadyDone) {
    throw createError({
      statusCode: 400,
      message: 'This attempt can no longer be submitted',
    })
  }

  const testRows = await db
    .select()
    .from(tests)
    .where(eq(tests.id, attemptRow.testId))
    .limit(1)

  const [testRow] = testRows

  if (!testRow) {
    throw createError({
      statusCode: 404,
      message: 'Test not found',
    })
  }

  const testMeta = getTestMeta(testRow)

  const questionRows = await db
    .select()
    .from(attemptQuestions)
    .where(eq(attemptQuestions.attemptId, attemptId))
    .orderBy(attemptQuestions.section, attemptQuestions.questionOrder)

  const scoringSettings = await getScoringSettings()
  const sectionStats = new Map<string, { totalRatio: number; count: number }>()

  for (const section of ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7']) {
    sectionStats.set(section, { totalRatio: 0, count: 0 })
  }

  // Compute all scores in memory first, then batch-update in a single SQL statement.
  const questionUpdates: Array<typeof attemptQuestions.$inferInsert> = []

  for (const question of questionRows) {
    const studentAnswers = getSectionAnswer(question, answers)
    const correctnessRatio = calculateCorrectnessRatio(question, studentAnswers)
    const earnedPoints = Math.round(correctnessRatio * 100)

    questionUpdates.push({
      ...question,
      studentAnswer1: studentAnswers.answer1,
      studentAnswer2: studentAnswers.answer2,
      studentAnswer3: studentAnswers.answer3,
      earnedPoints,
    })

    const stat = sectionStats.get(question.section)
    if (stat) {
      stat.totalRatio += correctnessRatio
      stat.count += 1
    }
  }

  if (questionUpdates.length > 0) {
    await db.insert(attemptQuestions)
      .values(questionUpdates)
      .onDuplicateKeyUpdate({
        set: {
          studentAnswer1: sql`VALUES(student_answer_1)`,
          studentAnswer2: sql`VALUES(student_answer_2)`,
          studentAnswer3: sql`VALUES(student_answer_3)`,
          earnedPoints: sql`VALUES(earned_points)`,
        },
      })
  }

  let weightedPercentage = 0

  for (const [section, stat] of sectionStats.entries()) {
    if (stat.count === 0) {
      continue
    }

    const sectionAverage = stat.totalRatio / stat.count
    const sectionWeightPercent = pointsForSection(section, scoringSettings)
    weightedPercentage += sectionAverage * sectionWeightPercent
  }

  const percentage = Math.round(weightedPercentage)
  const totalQuestions = testMeta.testPoints
  const score = Math.round((percentage / 100) * totalQuestions)

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
    percentage,
  }
}
