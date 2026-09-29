import bcrypt from 'bcrypt';
import {
  createUserSchema,
  updateUserSchema,
  productSchema,
  parseId,
  validate,
} from '../utils/validation.js';
import { HttpError, ok, publicUser } from '../utils/errors.js';

export function catalogController(store, table) {
  const isUser = table === 'usuarios';
  const safe = (row) => (isUser ? publicUser(row) : { ...row, activo: Boolean(row.activo) });
  return {
    async list(req, res) {
      return ok(res, (await store.list(table)).map(safe));
    },
    async get(req, res) {
      const row = await store.find(table, parseId(req.params.id));
      if (!row) throw new HttpError(404, 'Registro no encontrado.');
      return ok(res, safe(row));
    },
    async create(req, res) {
      const data = validate(isUser ? createUserSchema : productSchema, req.body);
      if (isUser) data.password = await bcrypt.hash(data.password, 12);
      return ok(res, safe(await store.create(table, data)), 'Registro creado correctamente', 201);
    },
    async update(req, res) {
      const id = parseId(req.params.id);
      const data = validate(isUser ? updateUserSchema : productSchema, req.body);
      if (isUser && id === req.user.id && (!data.activo || data.rol !== 'administrador')) {
        throw new HttpError(409, 'No puedes desactivar tu cuenta ni cambiar tu propio rol.');
      }
      if (isUser && data.password) data.password = await bcrypt.hash(data.password, 12);
      return ok(
        res,
        safe(await store.update(table, id, data)),
        'Registro actualizado correctamente',
      );
    },
    async remove(req, res) {
      const id = parseId(req.params.id);
      if (isUser && id === req.user.id)
        throw new HttpError(409, 'No puedes eliminar tu propia cuenta.');
      await store.remove(table, id);
      return ok(res, null, 'Registro eliminado correctamente');
    },
  };
}
