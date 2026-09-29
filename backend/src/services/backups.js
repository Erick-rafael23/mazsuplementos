import { mkdir, readdir, stat, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function backupService(store, directory, mode) {
  return {
    async list() {
      await mkdir(directory, { recursive: true });
      const names = (await readdir(directory)).filter((name) => /^backup_[\w-]+\.json$/.test(name));
      const entries = await Promise.all(
        names.map(async (nombre) => {
          const info = await stat(path.join(directory, nombre));
          return { nombre, fecha: info.mtime.toISOString(), bytes: info.size };
        }),
      );
      return entries.sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    async create() {
      await mkdir(directory, { recursive: true });
      const fecha = new Date().toISOString();
      const nombre = `backup_${fecha.replace(/[:.]/g, '-')}_${randomUUID()}.json`;
      const data = {
        version: 1,
        aplicacion: 'MAZ Suplementos',
        origen: mode,
        fecha,
        tablas: await store.snapshot(),
      };
      const body = JSON.stringify(data, null, 2);
      const destination = path.join(directory, nombre);
      try {
        await writeFile(`${destination}.tmp`, body, { flag: 'wx', mode: 0o600 });
        await rename(`${destination}.tmp`, destination);
      } catch (error) {
        await unlink(`${destination}.tmp`).catch(() => {});
        throw error;
      }
      return {
        nombre,
        fecha,
        bytes: Buffer.byteLength(body),
        registros: Object.values(data.tablas).reduce((sum, rows) => sum + rows.length, 0),
      };
    },
  };
}
