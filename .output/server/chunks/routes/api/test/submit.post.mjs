import { d as defineEventHandler, a as getCookie, c as createError, r as readBody, g as getDb, o as compareIps } from '../../../nitro/nitro.mjs';
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

const submit_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const sessionCookie = getCookie(event, "session");
  if (!sessionCookie) throw createError({ statusCode: 401, message: "Not authenticated" });
  const body = await readBody(event);
  const { sessionId, answers } = body;
  const db = getDb();
  const session = db.prepare("SELECT * FROM test_sessions WHERE id = ?").get(sessionId);
  if (!session) throw createError({ statusCode: 404, message: "Session not found" });
  const tasks = JSON.parse(session.tasks_json);
  let score = 0;
  let total = 0;
  for (let i = 0; i < tasks.level1.length; i++) {
    total++;
    if (compareIps(((_a = answers.level1) == null ? void 0 : _a[i]) || "", tasks.level1[i].decimal)) score++;
  }
  for (let i = 0; i < tasks.level2.length; i++) {
    total++;
    if ((((_b = answers.level2) == null ? void 0 : _b[i]) || "") === tasks.level2[i].class) score++;
  }
  for (let i = 0; i < tasks.level3.length; i++) {
    total += 2;
    if (compareIps(((_d = (_c = answers.level3) == null ? void 0 : _c[i]) == null ? void 0 : _d.network) || "", tasks.level3[i].networkAddr)) score++;
    if (compareIps(((_f = (_e = answers.level3) == null ? void 0 : _e[i]) == null ? void 0 : _f.broadcast) || "", tasks.level3[i].broadcastAddr)) score++;
  }
  for (let i = 0; i < tasks.level4.length; i++) {
    total++;
    if (parseInt(((_g = answers.level4) == null ? void 0 : _g[i]) || "0") === tasks.level4[i].hostCount) score++;
  }
  for (let i = 0; i < tasks.level5.length; i++) {
    total++;
    const expected = tasks.level5[i].sameNetwork ? "Yes" : "No";
    if ((((_h = answers.level5) == null ? void 0 : _h[i]) || "") === expected) score++;
  }
  for (let i = 0; i < tasks.level6.subnets.length; i++) {
    total += 3;
    const correct = tasks.level6.subnets[i];
    if (compareIps(((_j = (_i = answers.level6) == null ? void 0 : _i[i]) == null ? void 0 : _j.network) || "", correct.networkAddr)) score++;
    if (compareIps(((_l = (_k = answers.level6) == null ? void 0 : _k[i]) == null ? void 0 : _l.mask) || "", correct.mask)) score++;
    if (compareIps(((_n = (_m = answers.level6) == null ? void 0 : _m[i]) == null ? void 0 : _n.broadcast) || "", correct.broadcastAddr)) score++;
  }
  db.prepare(
    'UPDATE test_sessions SET answers_json = ?, score = ?, total_questions = ?, submitted_at = datetime("now") WHERE id = ?'
  ).run(JSON.stringify(answers), score, total, sessionId);
  return { score, total, percentage: Math.round(score / total * 100) };
});

export { submit_post as default };
//# sourceMappingURL=submit.post.mjs.map
