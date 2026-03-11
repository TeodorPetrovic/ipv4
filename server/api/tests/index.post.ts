import { requireAdminSession } from '../../utils/service/auth'
import { createTest } from '../../utils/service/tests'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const body = await readBody<{
    title?: string
    description?: string
    startAt?: string
    endAt?: string
    durationMinutes?: number
    maxAttempts?: number
    isPublished?: boolean | number
  }>(event)

  return createTest({
    title: body.title || '',
    description: body.description,
    startAt: body.startAt || '',
    endAt: body.endAt || '',
    durationMinutes: body.durationMinutes ?? 60,
    maxAttempts: body.maxAttempts ?? 1,
    isPublished: body.isPublished,
  })
})
