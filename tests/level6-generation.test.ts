import { describe, expect, test } from 'bun:test'

import { generateLevel6QuestionSeeds } from '../server/utils/level6-generator'
import { isValidIp, sameNetwork } from '../server/utils/ipv4'

describe('Level 6 generation', () => {
  test('every batch includes both same-subnet and different-subnet answers', () => {
    for (let i = 0; i < 80; i += 1) {
      const questions = generateLevel6QuestionSeeds(5)
      const answers = questions.map(question => question.expectedAnswer1)

      expect(answers).toContain('1')
      expect(answers).toContain('0')
    }
  })

  test('expected answer always matches sameNetwork calculation', () => {
    for (let i = 0; i < 80; i += 1) {
      const questions = generateLevel6QuestionSeeds(5)

      for (const question of questions) {
        expect(isValidIp(question.promptPrimary)).toBe(true)
        expect(isValidIp(question.promptSecondary)).toBe(true)

        const computed = sameNetwork(question.promptPrimary, question.promptSecondary, question.promptTertiary)
        expect(question.expectedAnswer1).toBe(computed ? '1' : '0')
      }
    }
  })
})
