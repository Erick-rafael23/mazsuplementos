import { loadConfig } from './config/env.js';
import { createPool } from './config/database.js';
import { createDemoStore } from './models/demo-store.js';
import { createSqlStore } from './models/sql-store.js';
import { createApp } from './app.js';

try {
  const config = loadConfig();
  let store;
  if (config.mode === 'demo') store = await createDemoStore(config.dataFile);
  else {
    const pool = createPool();
    try {
      await pool.execute('SELECT id FROM usuarios LIMIT 1');
    } catch (error) {
      await pool.end();
      throw error;
    }
    store = createSqlStore(pool);
  }
  const server = createApp(store, config).listen(config.port, config.host, () => {
    console.log(
      `MAZ API: http://${config.host}:${config.port} · ${config.mode === 'demo' ? 'DEMO LOCAL (sin TiDB)' : 'TiDB con TLS'}`,
    );
  });
  server.on('error', async (error) => {
    console.error('No se pudo iniciar el servidor:', error.code);
    await store.close();
    process.exit(1);
  });
  const shutdown = () =>
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('No se pudo iniciar MAZ:', error.code || error.message);
  process.exit(1);
}
