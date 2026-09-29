import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { apiRoutes } from './routes/api.js';
import { errorHandler } from './middleware/errors.js';

export function createApp(store, config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({ strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }),
  );
  app.use(
    cors({
      origin: config.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(
    '/api',
    (req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    apiRoutes(store, config),
  );
  app.use('/api', (req, res) =>
    res.status(404).json({ success: false, message: 'Endpoint no encontrado.' }),
  );
  if (config.frontendDir && existsSync(path.join(config.frontendDir, 'index.html'))) {
    app.use(express.static(config.frontendDir));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(config.frontendDir, 'index.html')));
  }
  app.use((req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada.' }));
  app.use(errorHandler);
  return app;
}
