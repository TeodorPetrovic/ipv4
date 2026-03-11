import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  const sessions = db.prepare(
    'SELECT id, student_name, student_id, score, total_questions, submitted_at, created_at, tasks_json, answers_json FROM test_sessions WHERE submitted_at IS NOT NULL ORDER BY submitted_at DESC'
  ).all()
  return sessions
})
