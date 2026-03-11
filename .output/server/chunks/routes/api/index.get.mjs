import { d as defineEventHandler, g as getDb } from '../../nitro/nitro.mjs';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';

const index_get = defineEventHandler(() => {
  const db = getDb();
  const sessions = db.prepare(
    "SELECT id, student_name, student_id, score, total_questions, submitted_at, created_at, tasks_json, answers_json FROM test_sessions WHERE submitted_at IS NOT NULL ORDER BY submitted_at DESC"
  ).all();
  return sessions;
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
