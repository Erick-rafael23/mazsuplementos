import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../backend/src/app.js';
import { createDemoStore } from '../backend/src/models/demo-store.js';

const directory = await mkdtemp(path.join(tmpdir(), 'maz-e2e-'));
const store = await createDemoStore(path.join(directory, 'demo.json'));
const app = createApp(store, {
  mode: 'demo',
  secret: randomBytes(48).toString('hex'),
  origin: 'http://127.0.0.1:5174',
  backupDir: path.join(directory, 'backups'),
});
const server = app.listen(3001, '127.0.0.1', () =>
  console.log('API aislada de pruebas en 3001. No usa TiDB ni backend/.env.'),
);
const stop = () =>
  server.close(async () => {
    await store.close();
    await rm(directory, { recursive: true, force: true });
    process.exit(0);
  });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
