import { withSafeApi } from '#server/utils/safe-api'
import { requireAdminSession } from '#server/utils/service/auth'
import { createTest } from '#server/utils/service/tests'

export default withSafeApi(async (event) => {
  requireAdminSession(event)

  const body = await readBody<{
    title?: string
    description?: string
    startAt?: string
    endAt?: string
    durationMinutes?: number
    maxAttempts?: number
    isPublished?: boolean | number
    testPoints?: number
    unlimitedDuration?: boolean
    unlimitedAttempts?: boolean
  }>(event)

  return createTest({
    title: body.title || '',
    description: body.description,
    startAt: body.startAt || '',
    endAt: body.endAt || '',
    durationMinutes: body.durationMinutes ?? 60,
    maxAttempts: body.maxAttempts ?? 1,
    isPublished: body.isPublished,
    testPoints: body.testPoints,
    unlimitedDuration: body.unlimitedDuration,
    unlimitedAttempts: body.unlimitedAttempts,
  })
})
