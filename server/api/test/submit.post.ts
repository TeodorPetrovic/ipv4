import { getDb } from '../../utils/db'
import { compareIps } from '../../utils/ipv4'

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'session')
  if (!sessionCookie) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const body = await readBody(event)
  const { sessionId, answers } = body

  const db = getDb()
  const session = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(sessionId) as any
  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })

  const tasks = JSON.parse(session.tasks_json)
  let score = 0
  let total = 0

  // Grade level 1
  for (let i = 0; i < tasks.level1.length; i++) {
    total++
    if (compareIps(answers.level1?.[i] || '', tasks.level1[i].decimal)) score++
  }

  // Grade level 2
  for (let i = 0; i < tasks.level2.length; i++) {
    total++
    if ((answers.level2?.[i] || '') === tasks.level2[i].class) score++
  }

  // Grade level 3
  for (let i = 0; i < tasks.level3.length; i++) {
    total += 2
    if (compareIps(answers.level3?.[i]?.network || '', tasks.level3[i].networkAddr)) score++
    if (compareIps(answers.level3?.[i]?.broadcast || '', tasks.level3[i].broadcastAddr)) score++
  }

  // Grade level 4
  for (let i = 0; i < tasks.level4.length; i++) {
    total++
    if (parseInt(answers.level4?.[i] || '0') === tasks.level4[i].hostCount) score++
  }

  // Grade level 5
  for (let i = 0; i < tasks.level5.length; i++) {
    total++
    const expected = tasks.level5[i].sameNetwork ? 'Yes' : 'No'
    if ((answers.level5?.[i] || '') === expected) score++
  }

  // Grade level 6
  for (let i = 0; i < tasks.level6.subnets.length; i++) {
    total += 3
    const correct = tasks.level6.subnets[i]
    if (compareIps(answers.level6?.[i]?.network || '', correct.networkAddr)) score++
    if (compareIps(answers.level6?.[i]?.mask || '', correct.mask)) score++
    if (compareIps(answers.level6?.[i]?.broadcast || '', correct.broadcastAddr)) score++
  }

  db.prepare(
    'UPDATE test_sessions SET answers_json = ?, score = ?, total_questions = ?, submitted_at = datetime("now") WHERE id = ?'
  ).run(JSON.stringify(answers), score, total, sessionId)

  return { score, total, percentage: Math.round((score / total) * 100) }
})
