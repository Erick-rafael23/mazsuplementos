import bcrypt from 'bcrypt';
import { loginSchema, validate } from '../utils/validation.js';
import { HttpError, ok, publicUser } from '../utils/errors.js';
import { issueToken } from '../middleware/auth.js';

// Hash de relleno para que un correo inexistente también requiera una comparación bcrypt.
const dummyHash = await bcrypt.hash('unused-comparison-password', 12);

export function authController(store, secret) {
  return {
    async login(req, res) {
      const data = validate(loginSchema, req.body);
      const user = await store.findByEmail(data.correo);
      const valid = await bcrypt.compare(data.password, user?.password || dummyHash);
      if (!user || !valid || !user.activo)
        throw new HttpError(401, 'Correo o contraseña incorrectos.');
      return ok(
        res,
        { token: issueToken(user, secret), usuario: publicUser(user) },
        'Sesión iniciada',
      );
    },
    me(req, res) {
      return ok(res, publicUser(req.user));
    },
  };
}
