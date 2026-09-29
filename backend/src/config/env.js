import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

export function loadConfig() {
  const mode = process.env.DATA_MODE || 'tidb';
  if (!['demo', 'tidb'].includes(mode)) throw new Error('DATA_MODE debe ser demo o tidb.');
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32)
    throw new Error('Configura JWT_SECRET con al menos 32 caracteres o ejecuta npm run setup.');
  if (mode === 'demo' && process.env.NODE_ENV === 'production') {
    throw new Error('El modo demo no está permitido en producción.');
  }
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT no válido.');
  return {
    mode,
    secret,
    port,
    host: process.env.HOST || '127.0.0.1',
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    dataFile: path.resolve(backendRoot, process.env.DEMO_DATA_FILE || 'data/demo.json'),
    backupDir: path.resolve(backendRoot, process.env.BACKUP_DIR || 'backups'),
    frontendDir: path.resolve(backendRoot, '../frontend/dist'),
  };
}
