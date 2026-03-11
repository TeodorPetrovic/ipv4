import { datetime, int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

export const testConfig = mysqlTable('test_config', {
  id: int('id').primaryKey(),
  startDate: datetime('start_date'),
  endDate: datetime('end_date'),
  durationMinutes: int('duration_minutes').default(60),
  adminPin: varchar('admin_pin', { length: 50 }).default('1234'),
})

export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 100 }).notNull(),
  createdAt: datetime('created_at'),
})

export const testSessions = mysqlTable('test_sessions', {
  id: int('id').primaryKey().autoincrement(),
  studentDbId: int('student_db_id'),
  studentName: varchar('student_name', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 100 }).notNull(),
  tasksJson: text('tasks_json').notNull(),
  answersJson: text('answers_json'),
  score: int('score'),
  totalQuestions: int('total_questions'),
  submittedAt: datetime('submitted_at'),
  createdAt: datetime('created_at'),
})
