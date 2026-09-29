import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSqlStore } from '../src/models/sql-store.js';

test('SQL mantiene datos del usuario fuera del texto de la consulta', async () => {
  const calls = [];
  const pool = {
    execute: async (sql, values) => {
      calls.push({ sql, values });
      return sql.startsWith('INSERT') ? [{ insertId: 10 }] : [[{ id: 10 }]];
    },
  };
  const store = createSqlStore(pool);
  const dangerous = "' OR 1=1; DROP TABLE usuarios; --";
  await store.findByEmail(dangerous);
  await store.create('productos_servicios', {
    nombre: dangerous,
    descripcion: '',
    precio: 1,
    tipo: 'producto',
    activo: true,
  });
  for (const call of calls) assert.ok(!call.sql.includes(dangerous));
  assert.equal(calls[0].values[0], dangerous);
  assert.equal(calls[1].values[0], dangerous);
  await assert.rejects(() => store.list('usuarios; DROP TABLE usuarios'), /Tabla no permitida/);
});

test('snapshot usa transacción y libera conexión después de confirmar', async () => {
  const calls = [];
  const connection = {
    query: async () => calls.push('isolation'),
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql) => {
      calls.push(sql.includes('usuarios') ? 'users' : 'products');
      return [[{ id: 1 }]];
    },
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
  };
  const store = createSqlStore({ getConnection: async () => connection });
  const snapshot = await store.snapshot();
  assert.deepEqual(calls, ['isolation', 'begin', 'users', 'products', 'commit', 'release']);
  assert.deepEqual(Object.keys(snapshot), ['usuarios', 'productos_servicios']);
});

test('snapshot revierte y libera conexión si falla una consulta', async () => {
  const calls = [];
  const connection = {
    query: async () => {},
    beginTransaction: async () => {},
    execute: async () => {
      throw new Error('DB unavailable');
    },
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
  };
  await assert.rejects(
    () => createSqlStore({ getConnection: async () => connection }).snapshot(),
    /DB unavailable/,
  );
  assert.deepEqual(calls, ['rollback', 'release']);
});
