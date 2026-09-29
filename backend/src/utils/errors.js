export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function ok(res, data, message = 'Consulta realizada correctamente', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function publicUser(user) {
  const { password, ...safe } = user;
  return { ...safe, activo: Boolean(safe.activo) };
}
