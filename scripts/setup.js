import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
for (const part of ['backend', 'frontend']) {
  let template = await readFile(new URL(`${part}/.env.example`, root), 'utf8');
  if (part === 'backend') {
    template = template
      .replace('JWT_SECRET=', `JWT_SECRET=${randomBytes(48).toString('hex')}`)
      .replace('TIDB_DATABASE=', 'TIDB_DATABASE=maz_suplementos');
  }
  try {
    await writeFile(new URL(`${part}/.env`, root), template, { flag: 'wx', mode: 0o600 });
    console.log(`${part}/.env creado${part === 'backend' ? ' para conectar con TiDB' : ''}.`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.log(`${part}/.env ya existe; se conserva su configuración.`);
  }
}
console.log(
  'Completa los datos de TiDB en backend/.env. Después ejecuta npm run db:init y npm run db:check.',
);
