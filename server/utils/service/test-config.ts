import { eq } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '../../database'
import { testConfig } from '../../database/schema'

interface SaveTestConfigInput {
  pin: string
  startDate: string | null
  endDate: string | null
  durationMinutes: number
  verifyOnly?: boolean
}

async function requireValidPin(pin: string) {
  const rows = await db
    .select({ adminPin: testConfig.adminPin })
    .from(testConfig)
    .where(eq(testConfig.id, 1))
    .limit(1)

  const correctPin = rows[0]?.adminPin || '1234'

  if (pin !== correctPin) {
    throw createError({
      statusCode: 403,
      message: 'Invalid PIN',
    })
  }
}

export async function getTestConfig() {
  const rows = await db
    .select()
    .from(testConfig)
    .where(eq(testConfig.id, 1))
    .limit(1)

  return rows[0] || { startDate: null, endDate: null, durationMinutes: 60 }
}

export async function saveTestConfig(input: SaveTestConfigInput) {
  await requireValidPin(input.pin)

  if (input.verifyOnly) {
    return
  }

  await db
    .update(testConfig)
    .set({
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      durationMinutes: input.durationMinutes ?? 60,
    })
    .where(eq(testConfig.id, 1))
}
