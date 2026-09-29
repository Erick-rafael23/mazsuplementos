import bcrypt from 'bcrypt';
import { createPool } from '../src/config/database.js';
import { createSqlStore } from '../src/models/sql-store.js';
import { createUserSchema, validate } from '../src/utils/validation.js';

let pool;
try {
  if (process.env.DATA_MODE !== 'tidb')
    throw new Error('Configura DATA_MODE=tidb antes de crear el administrador real.');
  const data = validate(createUserSchema, {
    nombre: process.env.ADMIN_NAME,
    correo: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    rol: 'administrador',
    activo: true,
  });
  pool = createPool();
  const store = createSqlStore(pool);
  if (await store.findByEmail(data.correo))
    throw new Error('Ese correo ya existe; el script no modifica cuentas existentes.');
  data.password = await bcrypt.hash(data.password, 12);
  const user = await store.create('usuarios', data);
  console.log(`Administrador creado: ${user.correo}. Retira ADMIN_PASSWORD de backend/.env.`);
} catch (error) {
  console.error('No se pudo crear el administrador:', error.code || error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
