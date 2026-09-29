import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcrypt';
import { HttpError } from '../utils/errors.js';

const sampleProducts = [
  ['Whey Protein · Chocolate', 'Proteína de suero, presentación de 2 lb. Sabor chocolate.', 899],
  ['Creatina Monohidratada', 'Creatina sin sabor, presentación de 300 g.', 449],
  ['Omega 3 · 120 cápsulas', 'Aceite de pescado en cápsulas blandas.', 329],
  ['Multivitamínico Daily', 'Complejo de vitaminas y minerales, 60 tabletas.', 289],
  ['Pre-entreno · Frutos rojos', 'Mezcla en polvo, presentación de 30 porciones.', 599],
  ['Whey Isolate · Vainilla', 'Proteína aislada de suero, presentación de 2 lb.', 1199],
  ['Shaker MAZ · 700 ml', 'Mezclador con rejilla y tapa de rosca.', 149],
  [
    'Asesoría de catálogo',
    'Sesión para conocer las presentaciones disponibles en la tienda.',
    0,
    'servicio',
  ],
];

// Adaptador exclusivo para la demostración local. TiDB utiliza sql-store.js.
export async function createDemoStore(file, { seed = true } = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  let state;
  try {
    state = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const now = new Date().toISOString();
    const password = seed ? await bcrypt.hash('MazDemo2026!', 12) : '';
    state = {
      usuarios: seed
        ? ['administrador', 'capturista', 'auditor'].map((rol, i) => ({
            id: i + 1,
            nombre: ['Alex Morgan', 'María López', 'Diego Torres'][i],
            correo: `${['admin', 'capturista', 'auditor'][i]}@maz.local`,
            password,
            rol,
            activo: true,
            created_at: now,
            updated_at: now,
          }))
        : [],
      productos_servicios: seed
        ? sampleProducts.map(([nombre, descripcion, precio, tipo = 'producto'], i) => ({
            id: i + 1,
            nombre,
            descripcion,
            precio,
            tipo,
            activo: true,
            created_at: now,
            updated_at: now,
          }))
        : [],
      nextIds: { usuarios: seed ? 4 : 1, productos_servicios: seed ? 9 : 1 },
    };
    await writeFile(file, JSON.stringify(state, null, 2), { flag: 'wx', mode: 0o600 });
  }
  let queue = Promise.resolve();
  const clone = (value) => structuredClone(value);
  const tableRows = (table, source = state) => {
    if (!['usuarios', 'productos_servicios'].includes(table))
      throw new Error('Tabla no permitida.');
    return source[table];
  };
  async function mutate(action) {
    const work = queue.then(async () => {
      const next = clone(state);
      const result = action(next);
      await writeFile(`${file}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
      await rename(`${file}.tmp`, file);
      state = next;
      return clone(result);
    });
    queue = work.catch(() => {});
    return work;
  }
  return {
    async list(table) {
      await queue;
      return clone(tableRows(table)).sort((a, b) => b.id - a.id);
    },
    async find(table, id) {
      await queue;
      return clone(tableRows(table).find((row) => row.id === id) || null);
    },
    async findByEmail(correo) {
      await queue;
      return clone(state.usuarios.find((row) => row.correo === correo) || null);
    },
    async create(table, data) {
      return mutate((next) => {
        const rows = tableRows(table, next);
        if (table === 'usuarios' && rows.some((row) => row.correo === data.correo))
          throw new HttpError(409, 'Ya existe un usuario con ese correo.');
        const now = new Date().toISOString();
        const row = { ...data, id: next.nextIds[table]++, created_at: now, updated_at: now };
        rows.push(row);
        return row;
      });
    },
    async update(table, id, data) {
      return mutate((next) => {
        const rows = tableRows(table, next);
        const row = rows.find((item) => item.id === id);
        if (!row) throw new HttpError(404, 'Registro no encontrado.');
        if (
          table === 'usuarios' &&
          rows.some((item) => item.id !== id && item.correo === data.correo)
        )
          throw new HttpError(409, 'Ya existe un usuario con ese correo.');
        Object.assign(row, data, { updated_at: new Date().toISOString() });
        return row;
      });
    },
    async remove(table, id) {
      return mutate((next) => {
        const rows = tableRows(table, next);
        const index = rows.findIndex((row) => row.id === id);
        if (index === -1) throw new HttpError(404, 'Registro no encontrado.');
        rows.splice(index, 1);
        return null;
      });
    },
    async snapshot() {
      await queue;
      return clone({ usuarios: state.usuarios, productos_servicios: state.productos_servicios });
    },
    async close() {
      await queue;
    },
  };
}
