import { desc, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { createError } from 'h3'

import { db } from '../../database'
import { appSettings, students } from '../../database/schema'

const STUDENT_COOKIE = 'student_session'
const ADMIN_COOKIE = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export interface StudentSession {
  studentDbId: number
  studentId: string
  name: string
}

function getFallbackStudentName(studentId: string) {
  return `Student ${studentId}`
}

function shouldUseSecureCookies(event: H3Event) {
  const forwardedProto = event.node.req.headers['x-forwarded-proto']

  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0].trim() === 'https'
  }

  if (Array.isArray(forwardedProto)) {
    return forwardedProto.some(value => value.split(',')[0].trim() === 'https')
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

  if (existingRows.length > 0) {
    return {
      id: existingRows[0].id,
      studentId: existingRows[0].studentId,
      name: existingRows[0].name,
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

  return {
    id: inserted.id,
    studentId: normalizedStudentId,
    name,
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
      adminEmail: appSettings.adminEmail,
      adminPassword: appSettings.adminPassword,
    })
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1)

  const adminEmail = rows[0]?.adminEmail?.trim().toLowerCase() ?? 'tpetrovic@singimail.rs'
  const adminPassword = rows[0]?.adminPassword ?? '123'

  if (normalizedEmail !== adminEmail || normalizedPassword !== adminPassword) {
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

export function getAuthState(event: H3Event) {
  return {
    student: getStudentSession(event),
    isAdmin: getCookie(event, ADMIN_COOKIE) === '1',
  }
}
