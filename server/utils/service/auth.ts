import { desc, eq } from 'drizzle-orm'
import { compare, hash } from 'bcryptjs'
import type { H3Event } from 'h3'
import { createError } from 'h3'

import { db } from '#server/database'
import { admins, students } from '#server/database/schema'

const STUDENT_COOKIE = 'student_session'
const ADMIN_COOKIE = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const STUDENT_SYNC_URL = 'https://sync.singidunum.ac.rs/api/index.php'

export interface StudentSession {
  studentDbId: number
  studentId: string
  name: string
}

interface AuthState {
  student: StudentSession | null
  isAdmin: boolean
}

interface StudentSyncPayload {
  indeks?: string
  ime?: string
  prezime?: string
  email?: string
}

interface StudentSyncResponse {
  type?: string
  code?: number | string
  message?: string
  get_student_info_full?: StudentSyncPayload
}

function buildStudentName(firstName?: string, lastName?: string) {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ')
}

function normalizeStudentSyncResponse(response: unknown): StudentSyncResponse {
  if (typeof response === 'string') {
    try {
      return JSON.parse(response) as StudentSyncResponse
    } catch {
      throw createError({
        statusCode: 502,
        message: 'Student sync returned unreadable JSON',
      })
    }
  }

  if (!response || typeof response !== 'object') {
    throw createError({
      statusCode: 502,
      message: 'Student sync returned an invalid response',
    })
  }

  return response as StudentSyncResponse
}

async function fetchStudentInfo(studentId: string) {
  const runtimeConfig = useRuntimeConfig()
  const apiKey = (
    process.env.SINGIDUNUM_SYNC_API_KEY
    || runtimeConfig.singidunumSyncApiKey
    || ''
  ).trim()

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Student sync API key is not configured',
    })
  }

  const url = new URL(STUDENT_SYNC_URL)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('action', 'get_student_info_full')
  url.searchParams.set('Indeks', studentId)
  url.searchParams.set('version', '1')

  let response: unknown

  try {
    response = await $fetch(url.toString())
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Unable to fetch student information',
    })
  }

  const normalizedResponse = normalizeStudentSyncResponse(response)

  if (normalizedResponse.type === 'error') {
    throw createError({
      statusCode: 404,
      message: normalizedResponse.message || 'Student not found',
    })
  }

  const responseCode = Number(normalizedResponse.code)

  if (normalizedResponse.type !== 'return' || responseCode !== 1000 || !normalizedResponse.get_student_info_full) {
    throw createError({
      statusCode: 502,
      message: 'Student sync returned an invalid response',
    })
  }

  const syncedStudentId = normalizedResponse.get_student_info_full.indeks?.trim() || studentId
  const name = buildStudentName(
    normalizedResponse.get_student_info_full.ime,
    normalizedResponse.get_student_info_full.prezime,
  )

  if (!name) {
    throw createError({
      statusCode: 502,
      message: 'Student sync response did not include a valid name',
    })
  }

  return {
    studentId: syncedStudentId,
    name,
  }
}

function shouldUseSecureCookies(event: H3Event) {
  const forwardedProto = event.node.req.headers['x-forwarded-proto']

  if (typeof forwardedProto === 'string') {
    const protocol = forwardedProto.split(',')[0]
    return protocol?.trim() === 'https'
  }

  if (Array.isArray(forwardedProto)) {
    return forwardedProto.some((value) => {
      const protocol = value.split(',')[0]
      return protocol?.trim() === 'https'
    })
  }

  const host = event.node.req.headers.host || ''
  const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)

  return process.env.NODE_ENV === 'production' && !isLocalHost
}

function getSessionCookieOptions(event: H3Event) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    expires: new Date(Date.now() + COOKIE_MAX_AGE * 1000),
    path: '/',
    secure: shouldUseSecureCookies(event),
  }
}

function getClearedCookieOptions(event: H3Event) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: shouldUseSecureCookies(event),
  }
}

export async function loginStudent(studentId: string) {
  const normalizedStudentId = studentId.trim()

  if (!normalizedStudentId) {
    throw createError({
      statusCode: 400,
      message: 'Student ID is required',
    })
  }

  const syncedStudent = await fetchStudentInfo(normalizedStudentId)

  const existingRows = await db
    .select()
    .from(students)
    .where(eq(students.studentId, syncedStudent.studentId))
    .orderBy(desc(students.id))
    .limit(1)

  const [existingStudent] = existingRows

  if (existingStudent) {
    if (existingStudent.name !== syncedStudent.name) {
      await db
        .update(students)
        .set({
          name: syncedStudent.name,
        })
        .where(eq(students.id, existingStudent.id))
    }

    return {
      id: existingStudent.id,
      studentId: existingStudent.studentId,
      name: syncedStudent.name,
    }
  }

  const [inserted] = await db
    .insert(students)
    .values({
      name: syncedStudent.name,
      studentId: syncedStudent.studentId,
      createdAt: new Date(),
    })
    .$returningId()

  if (!inserted) {
    throw createError({
      statusCode: 500,
      message: 'Unable to create student session',
    })
  }

  return {
    id: inserted.id,
    studentId: syncedStudent.studentId,
    name: syncedStudent.name,
  }
}

async function ensureDefaultAdmin() {
  const defaultEmail = (process.env.ADMIN_EMAIL || 'tpetrovic@singimail.rs').trim().toLowerCase()
  const defaultPassword = process.env.ADMIN_PASSWORD || '123'

  const existingRows = await db
    .select({
      id: admins.id,
      email: admins.email,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(eq(admins.email, defaultEmail))
    .orderBy(desc(admins.id))
    .limit(1)

  const [existingAdmin] = existingRows
  if (existingAdmin) {
    return existingAdmin
  }

  const now = new Date()
  const passwordHash = await hash(defaultPassword, 10)
  const [inserted] = await db
    .insert(admins)
    .values({
      email: defaultEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .$returningId()

  if (!inserted) {
    throw createError({
      statusCode: 500,
      message: 'Unable to initialize admin account',
    })
  }

  return {
    id: inserted.id,
    email: defaultEmail,
    passwordHash,
  }
}

export function setStudentSession(event: H3Event, student: StudentSession) {
  setCookie(event, STUDENT_COOKIE, JSON.stringify(student), getSessionCookieOptions(event))
}

export function clearStudentSession(event: H3Event) {
  deleteCookie(event, STUDENT_COOKIE, getClearedCookieOptions(event))
}

export function getStudentSession(event: H3Event): StudentSession | null {
  const cookie = getCookie(event, STUDENT_COOKIE)

  if (!cookie) {
    return null
  }

  try {
    return JSON.parse(cookie) as StudentSession
  } catch {
    return null
  }
}

export function requireStudentSession(event: H3Event) {
  const session = getStudentSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Student login required',
    })
  }

  return session
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()

  if (!normalizedEmail || !normalizedPassword) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required',
    })
  }

  const rows = await db
    .select({
      id: admins.id,
      email: admins.email,
      passwordHash: admins.passwordHash,
    })
    .from(admins)
    .where(eq(admins.email, normalizedEmail))
    .orderBy(desc(admins.id))
    .limit(1)

  const adminRow = rows[0] ?? await ensureDefaultAdmin()
  const passwordsMatch = await compare(normalizedPassword, adminRow.passwordHash)

  if (!passwordsMatch) {
    throw createError({
      statusCode: 403,
      message: 'Invalid admin credentials',
    })
  }
}

export function setAdminSession(event: H3Event) {
  setCookie(event, ADMIN_COOKIE, '1', getSessionCookieOptions(event))
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, ADMIN_COOKIE, getClearedCookieOptions(event))
}

export function requireAdminSession(event: H3Event) {
  const cookie = getCookie(event, ADMIN_COOKIE)

  if (cookie !== '1') {
    throw createError({
      statusCode: 401,
      message: 'Admin login required',
    })
  }
}

export function getAuthState(event: H3Event): AuthState {
  return {
    student: getStudentSession(event),
    isAdmin: getCookie(event, ADMIN_COOKIE) === '1',
  }
}
