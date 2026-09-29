import { z } from 'zod';
import { HttpError } from './errors.js';

export const roles = ['administrador', 'capturista', 'auditor'];
const name = z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(120);
const email = z.string().trim().toLowerCase().email('Correo no válido.').max(190);
export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres.')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'La contraseña no puede superar 72 bytes.',
  );
export const loginSchema = z
  .object({
    correo: email,
    password: z
      .string()
      .min(1)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Contraseña demasiado larga.'),
  })
  .strict();
const userBase = {
  nombre: name,
  correo: email,
  rol: z.enum(roles),
  activo: z.boolean().default(true),
};
export const createUserSchema = z.object({ ...userBase, password: passwordSchema }).strict();
export const updateUserSchema = z
  .object({ ...userBase, password: passwordSchema.optional() })
  .strict();
export const productSchema = z
  .object({
    nombre: name,
    descripcion: z.string().trim().max(2000).default(''),
    tipo: z.enum(['producto', 'servicio']),
    precio: z
      .union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio no válido.')])
      .transform(Number)
      .pipe(z.number().finite().min(0).max(99999999.99))
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
        'Usa como máximo dos decimales.',
      ),
    activo: z.boolean().default(true),
  })
  .strict();

export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' '),
    );
  }
  return result.data;
}

export function parseId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(400, 'El identificador debe ser un entero positivo válido.');
  }
  return Number(value);
}
