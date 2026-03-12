import { eq } from 'drizzle-orm'
import { createError } from 'h3'

import { db } from '#server/database'
import { settings } from '#server/database/schema'

export interface ScoringSettings {
  level1: number
  level2: number
  level3: number
  level4: number
  level5: number
  level6: number
  level7: number
}

const SCORING_KEY = 'scoring'

const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  level1: 10,
  level2: 15,
  level3: 20,
  level4: 10,
  level5: 10,
  level6: 15,
  level7: 20,
}

function toPercentageValue(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return fallback
  }

  return Math.round(parsed)
}

function totalPercentage(s: ScoringSettings) {
  return s.level1 + s.level2 + s.level3 + s.level4 + s.level5 + s.level6 + s.level7
}

export function normalizeScoringSettings(input?: Partial<ScoringSettings> | null): ScoringSettings {
  return {
    level1: toPercentageValue(input?.level1, DEFAULT_SCORING_SETTINGS.level1),
    level2: toPercentageValue(input?.level2, DEFAULT_SCORING_SETTINGS.level2),
    level3: toPercentageValue(input?.level3, DEFAULT_SCORING_SETTINGS.level3),
    level4: toPercentageValue(input?.level4, DEFAULT_SCORING_SETTINGS.level4),
    level5: toPercentageValue(input?.level5, DEFAULT_SCORING_SETTINGS.level5),
    level6: toPercentageValue(input?.level6, DEFAULT_SCORING_SETTINGS.level6),
    level7: toPercentageValue(input?.level7, DEFAULT_SCORING_SETTINGS.level7),
  }
}

export async function getScoringSettings(): Promise<ScoringSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SCORING_KEY))
    .limit(1)

  const storedValue = rows[0]?.value ? JSON.parse(rows[0].value) as Partial<ScoringSettings> : null
  const normalized = normalizeScoringSettings(storedValue)

  if (totalPercentage(normalized) !== 100) {
    return DEFAULT_SCORING_SETTINGS
  }

  return normalized
}

export async function updateScoringSettings(input?: Partial<ScoringSettings> | null): Promise<ScoringSettings> {
  const normalized = normalizeScoringSettings(input)

  if (totalPercentage(normalized) !== 100) {
    throw createError({
      statusCode: 400,
      message: 'Scoring percentages must add up to exactly 100%',
    })
  }

  const now = new Date()

  await db
    .insert(settings)
    .values({ key: SCORING_KEY, value: JSON.stringify(normalized), updatedAt: now })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(normalized), updatedAt: now } })

  return normalized
}
