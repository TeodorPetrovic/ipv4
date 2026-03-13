import { desc, eq } from 'drizzle-orm'
import { compare, hash } from 'bcryptjs'
import type { H3Event } from 'h3'
import { createError } from 'h3'

import { db } from '#server/database'
import { admins, students } from '#server/database/schema'

const STUDENT_COOKIE = 'student_session'
const ADMIN_COOKIE = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export interface StudentSession {
  studentDbId: number
  studentId: string
  name: string
}

interface AuthState {
  student: StudentSession | null
  isAdmin: boolean
}

function getFallbackStudentName(studentId: string) {
  return `Student ${studentId}`
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

  const existingRows = await db
    .select()
    .from(students)
    .where(eq(students.studentId, normalizedStudentId))
    .orderBy(desc(students.id))
    .limit(1)

  const [existingStudent] = existingRows

  if (existingStudent) {
    return {
      id: existingStudent.id,
      studentId: existingStudent.studentId,
      name: existingStudent.name,
    }
  }

  const name = getFallbackStudentName(normalizedStudentId)
  const [inserted] = await db
    .insert(students)
    .values({
      name,
      studentId: normalizedStudentId,
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
    studentId: normalizedStudentId,
    name,
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
