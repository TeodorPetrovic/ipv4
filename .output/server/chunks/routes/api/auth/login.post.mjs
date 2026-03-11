import { d as defineEventHandler, r as readBody, c as createError, g as getDb, s as setCookie } from '../../../nitro/nitro.mjs';
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

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, studentId } = body;
  if (!name || !studentId) {
    throw createError({ statusCode: 400, message: "Name and student ID are required" });
  }
  const db = getDb();
  let student = db.prepare("SELECT * FROM students WHERE student_id = ?").get(studentId);
  if (!student) {
    const result = db.prepare("INSERT INTO students (name, student_id) VALUES (?, ?)").run(name, studentId);
    student = { id: result.lastInsertRowid, name, student_id: studentId };
  }
  setCookie(event, "session", JSON.stringify({ studentDbId: student.id, name: student.name, studentId: student.student_id }), {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    secure: true
  });
  return { success: true, student: { id: student.id, name: student.name, studentId: student.student_id } };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
