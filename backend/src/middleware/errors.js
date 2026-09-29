export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message =
    status < 500 ? error.message : 'Ocurrió un error en el servidor. Intenta nuevamente.';
  if (error.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Ya existe un usuario con ese correo.';
  }
  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la solicitud debe ser JSON válido.';
  }
  if (error.type === 'entity.too.large') {
    status = 413;
    message = 'La solicitud es demasiado grande.';
  }
  if (status >= 500) console.error('Error del servidor:', error.code || error.name);
  res.status(status).json({ success: false, message });
}
