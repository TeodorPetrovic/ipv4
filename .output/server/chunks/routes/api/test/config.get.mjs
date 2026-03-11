import { d as defineEventHandler, g as getDb } from '../../../nitro/nitro.mjs';
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

const config_get = defineEventHandler(() => {
  const db = getDb();
  const config = db.prepare("SELECT * FROM test_config WHERE id = 1").get();
  return config || { start_date: null, end_date: null, duration_minutes: 60 };
});

export { config_get as default };
//# sourceMappingURL=config.get.mjs.map
