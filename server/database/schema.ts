import { datetime, int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

export const appSettings = mysqlTable('app_settings', {
  id: int('id').primaryKey(),
  adminEmail: varchar('admin_email', { length: 255 }).notNull(),
  adminPassword: varchar('admin_password', { length: 255 }).notNull(),
})

export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 100 }).notNull(),
  createdAt: datetime('created_at'),
})

export const tests = mysqlTable('tests', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startAt: datetime('start_at').notNull(),
  endAt: datetime('end_at').notNull(),
  durationMinutes: int('duration_minutes').notNull(),
  maxAttempts: int('max_attempts').notNull(),
  isPublished: int('is_published').notNull(),
  createdAt: datetime('created_at'),
  updatedAt: datetime('updated_at'),
})

export const testAttempts = mysqlTable('test_attempts', {
  id: int('id').primaryKey().autoincrement(),
  testId: int('test_id').notNull(),
  studentId: int('student_id').notNull(),
  attemptNumber: int('attempt_number').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  startedAt: datetime('started_at').notNull(),
  deadlineAt: datetime('deadline_at').notNull(),
  submittedAt: datetime('submitted_at'),
  score: int('score'),
  totalQuestions: int('total_questions'),
  createdAt: datetime('created_at'),
})

export const attemptQuestions = mysqlTable('attempt_questions', {
  id: int('id').primaryKey().autoincrement(),
  attemptId: int('attempt_id').notNull(),
  section: varchar('section', { length: 32 }).notNull(),
  questionOrder: int('question_order').notNull(),
  contextPrimary: varchar('context_primary', { length: 255 }),
  contextSecondary: varchar('context_secondary', { length: 255 }),
  promptPrimary: varchar('prompt_primary', { length: 255 }).notNull(),
  promptSecondary: varchar('prompt_secondary', { length: 255 }),
  promptTertiary: varchar('prompt_tertiary', { length: 255 }),
  expectedAnswer1: varchar('expected_answer_1', { length: 255 }).notNull(),
  expectedAnswer2: varchar('expected_answer_2', { length: 255 }),
  expectedAnswer3: varchar('expected_answer_3', { length: 255 }),
  studentAnswer1: varchar('student_answer_1', { length: 255 }),
  studentAnswer2: varchar('student_answer_2', { length: 255 }),
  studentAnswer3: varchar('student_answer_3', { length: 255 }),
  points: int('points').notNull(),
  earnedPoints: int('earned_points'),
  createdAt: datetime('created_at'),
})
