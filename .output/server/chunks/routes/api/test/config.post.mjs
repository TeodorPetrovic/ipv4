import { d as defineEventHandler, r as readBody, g as getDb, c as createError } from '../../../nitro/nitro.mjs';
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

const config_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { pin, startDate, endDate, durationMinutes } = body;
  const db = getDb();
  const config = db.prepare("SELECT admin_pin FROM test_config WHERE id = 1").get();
  const correctPin = (config == null ? void 0 : config.admin_pin) || "1234";
  if (pin !== correctPin) {
    throw createError({ statusCode: 403, message: "Invalid PIN" });
  }
  if (!body.verifyOnly) {
    db.prepare("UPDATE test_config SET start_date = ?, end_date = ?, duration_minutes = ? WHERE id = 1").run(startDate || null, endDate || null, durationMinutes || 60);
  }
  return { success: true };
});

export { config_post as default };
//# sourceMappingURL=config.post.mjs.map
