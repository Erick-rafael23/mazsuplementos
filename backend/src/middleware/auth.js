import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { HttpError } from '../utils/errors.js';

export const passwordStamp = (user) => createHash('sha256').update(user.password).digest('hex');
export function issueToken(user, secret) {
  return jwt.sign({ pv: passwordStamp(user) }, secret, {
    subject: String(user.id),
    expiresIn: '2h',
    algorithm: 'HS256',
    issuer: 'maz-api',
    audience: 'maz-web',
  });
}

export function authenticateToken(store, secret) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Inicia sesión para continuar.');
    let payload;
    try {
      payload = jwt.verify(header.slice(7), secret, {
        algorithms: ['HS256'],
        issuer: 'maz-api',
        audience: 'maz-web',
      });
    } catch {
      throw new HttpError(401, 'Tu sesión venció o no es válida. Inicia sesión nuevamente.');
    }
    const user = await store.find('usuarios', Number(payload.sub));
    // Consultamos el rol actual: desactivar, borrar o cambiar contraseña invalida el acceso inmediatamente.
    if (!user || !user.activo || payload.pv !== passwordStamp(user))
      throw new HttpError(401, 'La sesión ya no está disponible.');
    req.user = user;
    next();
  };
}

export function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user) throw new HttpError(401, 'Inicia sesión para continuar.');
    if (!allowed.includes(req.user.rol))
      throw new HttpError(403, 'No tienes permisos para realizar esta operación.');
    next();
  };
}
