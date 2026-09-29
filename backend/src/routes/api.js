import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth-controller.js';
import { catalogController } from '../controllers/catalog-controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { backupService } from '../services/backups.js';
import { ok } from '../utils/errors.js';

const limited = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.',
    },
  });

export function apiRoutes(store, config) {
  const router = Router();
  const auth = authController(store, config.secret);
  router.get('/health', (req, res) => ok(res, { status: 'ok', mode: config.mode }));
  router.post('/auth/login', limited(15 * 60 * 1000, 30), auth.login);
  router.use(authenticateToken(store, config.secret));
  router.get('/auth/me', auth.me);
  for (const [route, table, readers, writers] of [
    ['/usuarios', 'usuarios', ['administrador', 'auditor'], ['administrador']],
    [
      '/productos',
      'productos_servicios',
      ['administrador', 'capturista', 'auditor'],
      ['capturista'],
    ],
  ]) {
    const controller = catalogController(store, table);
    router.get(route, authorizeRoles(...readers), controller.list);
    router.get(`${route}/:id`, authorizeRoles(...readers), controller.get);
    router.post(route, authorizeRoles(...writers), controller.create);
    router.put(`${route}/:id`, authorizeRoles(...writers), controller.update);
    router.delete(`${route}/:id`, authorizeRoles(...writers), controller.remove);
  }
  const backups = backupService(store, config.backupDir, config.mode);
  router.get('/backups', authorizeRoles('administrador'), async (req, res) =>
    ok(res, await backups.list()),
  );
  router.post(
    '/backups',
    authorizeRoles('administrador'),
    limited(60 * 1000, 5),
    async (req, res) => {
      return ok(res, await backups.create(), 'Respaldo creado correctamente', 201);
    },
  );
  return router;
}
