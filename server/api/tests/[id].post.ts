import { requireAdminSession } from '../../utils/service/auth'
import { updateTest } from '../../utils/service/tests'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)

  const testId = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(testId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid test ID',
    })
  }

  const body = await readBody<{
    title?: string
    description?: string
    startAt?: string
    endAt?: string
    durationMinutes?: number
    maxAttempts?: number
    isPublished?: boolean | number
  }>(event)

  return updateTest(testId, {
    title: body.title || '',
    description: body.description,
    startAt: body.startAt || '',
    endAt: body.endAt || '',
    durationMinutes: body.durationMinutes ?? 60,
    maxAttempts: body.maxAttempts ?? 1,
    isPublished: body.isPublished,
  })
})
