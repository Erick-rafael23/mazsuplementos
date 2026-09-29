import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDemoStore } from '../src/models/demo-store.js';
import { issueToken } from '../src/middleware/auth.js';

let directory, store, app;
const secret = 'test-only-secret-with-at-least-thirty-two-characters';
const tokens = {};
const sampleProduct = {
  nombre: 'Creatina de prueba',
  descripcion: '300 g',
  tipo: 'producto',
  precio: 450.5,
  activo: true,
};
const sampleUser = {
  nombre: 'Usuario de prueba',
  correo: 'prueba@example.com',
  password: 'PruebaSegura2026!',
  rol: 'auditor',
  activo: true,
};
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'maz-api-test-'));
  store = await createDemoStore(path.join(directory, 'demo.json'));
  app = createApp(store, {
    secret,
    mode: 'demo',
    origin: 'http://localhost:5173',
    backupDir: path.join(directory, 'backups'),
  });
  for (const user of await store.list('usuarios')) tokens[user.rol] = issueToken(user, secret);
});
after(async () => {
  await store?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});
const auth = (role) => `Bearer ${tokens[role]}`;

test('login emite JWT, normaliza correo y nunca expone el hash', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ correo: ' ADMIN@MAZ.LOCAL ', password: 'MazDemo2026!' });
  assert.equal(response.status, 200);
  assert.ok(response.body.data.token);
  assert.equal(response.body.data.usuario.password, undefined);
  assert.equal(jwt.verify(response.body.data.token, secret).sub, '1');
  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${response.body.data.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.rol, 'administrador');
  assert.equal(me.body.data.password, undefined);
});

test('credenciales incorrectas o usuario desconocido reciben 401 sin revelar existencia', async () => {
  for (const correo of ['admin@maz.local', 'desconocido@example.com']) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ correo, password: 'contraseña-incorrecta' });
    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Correo o contraseña incorrectos.');
  }
});

for (const endpoint of [
  '/usuarios',
  '/usuarios/1',
  '/productos',
  '/productos/1',
  '/backups',
  '/auth/me',
]) {
  test(`GET ${endpoint} exige autenticación`, async () => {
    assert.equal((await request(app).get(`/api${endpoint}`)).status, 401);
  });
}
for (const [method, endpoint] of [
  ['post', '/usuarios'],
  ['put', '/usuarios/1'],
  ['delete', '/usuarios/1'],
  ['post', '/productos'],
  ['put', '/productos/1'],
  ['delete', '/productos/1'],
  ['post', '/backups'],
]) {
  test(`${method.toUpperCase()} ${endpoint} exige autenticación`, async () => {
    assert.equal((await request(app)[method](`/api${endpoint}`).send({})).status, 401);
  });
}

for (const role of ['administrador', 'capturista', 'auditor']) {
  for (const catalog of ['usuarios', 'productos']) {
    const canRead = !(role === 'capturista' && catalog === 'usuarios');
    const canWrite = role === (catalog === 'usuarios' ? 'administrador' : 'capturista');
    test(`${role}: GET /${catalog} y /:id respetan permisos`, async () => {
      for (const suffix of ['', '/1']) {
        const response = await request(app)
          .get(`/api/${catalog}${suffix}`)
          .set('Authorization', auth(role));
        assert.equal(response.status, canRead ? 200 : 403);
        assert.ok(!JSON.stringify(response.body).includes('"password"'));
      }
    });
    test(`${role}: POST, PUT y DELETE /${catalog} respetan permisos en el servidor`, async () => {
      const table = catalog === 'usuarios' ? 'usuarios' : 'productos_servicios';
      const payload =
        catalog === 'usuarios' ? { ...sampleUser, correo: `${role}@example.com` } : sampleProduct;
      const response = await request(app)
        .post(`/api/${catalog}`)
        .set('Authorization', auth(role))
        .send(payload);
      assert.equal(response.status, canWrite ? 201 : 403);
      const record = canWrite
        ? response.body.data
        : await store.create(
            table,
            catalog === 'usuarios'
              ? { ...payload, password: await bcrypt.hash(payload.password, 4) }
              : payload,
          );
      const update = await request(app)
        .put(`/api/${catalog}/${record.id}`)
        .set('Authorization', auth(role))
        .send({ ...payload, nombre: 'Registro actualizado' });
      assert.equal(update.status, canWrite ? 200 : 403);
      if (canWrite) assert.equal(update.body.data.nombre, 'Registro actualizado');
      const removal = await request(app)
        .delete(`/api/${catalog}/${record.id}`)
        .set('Authorization', auth(role));
      assert.equal(removal.status, canWrite ? 200 : 403);
      assert.equal(Boolean(await store.find(table, record.id)), !canWrite);
      if (!canWrite) await store.remove(table, record.id);
    });
    if (!canRead)
      test(`${role} no recibe datos al consultar usuarios`, async () => {
        const response = await request(app).get('/api/usuarios').set('Authorization', auth(role));
        assert.equal(response.body.data, undefined);
      });
  }
}

test('validación rechaza precios negativos, decimales extra, campos desconocidos e identificadores inválidos', async () => {
  for (const payload of [
    { ...sampleProduct, precio: -1 },
    { ...sampleProduct, precio: 1.234 },
    { ...sampleProduct, precio: '' },
    { ...sampleProduct, activo: 'false' },
    { ...sampleProduct, rol: 'administrador' },
  ]) {
    assert.equal(
      (
        await request(app)
          .post('/api/productos')
          .set('Authorization', auth('capturista'))
          .send(payload)
      ).status,
      400,
    );
  }
  for (const id of ['0', '-1', '1abc', '99999999999999999999']) {
    assert.equal(
      (await request(app).get(`/api/productos/${id}`).set('Authorization', auth('auditor'))).status,
      400,
    );
  }
  assert.equal(
    (await request(app).get('/api/productos/999999').set('Authorization', auth('auditor'))).status,
    404,
  );
  assert.equal(
    (
      await request(app)
        .put('/api/productos/999999')
        .set('Authorization', auth('capturista'))
        .send(sampleProduct)
    ).status,
    404,
  );
  assert.equal(
    (await request(app).delete('/api/productos/999999').set('Authorization', auth('capturista')))
      .status,
    404,
  );
});

test('correo único, rol cerrado y contraseña segura', async () => {
  for (const [payload, status] of [
    [{ ...sampleUser, correo: 'admin@maz.local' }, 409],
    [{ ...sampleUser, rol: 'superadmin' }, 400],
    [{ ...sampleUser, password: '123' }, 400],
    [{ ...sampleUser, password: 'á'.repeat(40) }, 400],
  ])
    assert.equal(
      (
        await request(app)
          .post('/api/usuarios')
          .set('Authorization', auth('administrador'))
          .send(payload)
      ).status,
      status,
    );
});

test('administrador no puede borrarse, desactivarse o cambiar su propio rol', async () => {
  assert.equal(
    (await request(app).delete('/api/usuarios/1').set('Authorization', auth('administrador')))
      .status,
    409,
  );
  for (const fields of [
    { activo: false, rol: 'administrador' },
    { activo: true, rol: 'auditor' },
  ]) {
    const response = await request(app)
      .put('/api/usuarios/1')
      .set('Authorization', auth('administrador'))
      .send({ nombre: 'Admin', correo: 'admin@maz.local', ...fields });
    assert.equal(response.status, 409);
  }
});

test('los cambios de rol, estado, contraseña y eliminación afectan a un JWT existente', async () => {
  const user = await store.create('usuarios', {
    ...sampleUser,
    correo: 'session@example.com',
    password: await bcrypt.hash(sampleUser.password, 4),
  });
  const token = issueToken(user, secret);
  const call = () => request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);
  assert.equal((await call()).status, 200);
  await store.update('usuarios', user.id, { rol: 'capturista' });
  assert.equal((await call()).status, 403);
  await store.update('usuarios', user.id, { activo: false });
  assert.equal((await call()).status, 401);
  const disabledLogin = await request(app)
    .post('/api/auth/login')
    .send({ correo: user.correo, password: sampleUser.password });
  assert.equal(disabledLogin.status, 401);
  await store.update('usuarios', user.id, {
    activo: true,
    password: await bcrypt.hash('OtraClaveSegura2026!', 4),
  });
  assert.equal((await call()).status, 401);
  const newToken = issueToken(await store.find('usuarios', user.id), secret);
  await store.remove('usuarios', user.id);
  assert.equal(
    (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${newToken}`)).status,
    401,
  );
});

test('JWT expirado y manipulado reciben 401', async () => {
  const expired = jwt.sign({ sub: '1' }, secret, {
    expiresIn: -1,
    issuer: 'maz-api',
    audience: 'maz-web',
  });
  for (const token of [expired, `${tokens.administrador.slice(0, -8)}modified`, 'not-a-token']) {
    assert.equal(
      (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status,
      401,
    );
  }
});

test('respaldo exclusivo de administrador, archivo completo y hashes bcrypt', async () => {
  for (const role of ['capturista', 'auditor']) {
    for (const method of ['get', 'post'])
      assert.equal(
        (await request(app)[method]('/api/backups').set('Authorization', auth(role))).status,
        403,
      );
  }
  const response = await request(app)
    .post('/api/backups')
    .set('Authorization', auth('administrador'));
  assert.equal(response.status, 201);
  const content = JSON.parse(
    await readFile(path.join(directory, 'backups', response.body.data.nombre), 'utf8'),
  );
  assert.equal(content.version, 1);
  assert.equal(content.origen, 'demo');
  assert.ok(content.tablas.productos_servicios.length > 0);
  for (const user of content.tablas.usuarios) assert.match(user.password, /^\$2[aby]\$/);
  assert.ok(!JSON.stringify(content).includes('MazDemo2026!'));
  const list = await request(app).get('/api/backups').set('Authorization', auth('administrador'));
  assert.equal(list.status, 200);
  assert.equal(list.body.data[0].nombre, response.body.data.nombre);
  assert.equal((await request(app).get(`/backups/${response.body.data.nombre}`)).status, 404);
});

test('JSON inválido y endpoints desconocidos devuelven respuestas consistentes', async () => {
  const invalid = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{invalid');
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.success, false);
  const unknown = await request(app)
    .get('/api/desconocido')
    .set('Authorization', auth('administrador'));
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.success, false);
});

test('demostración persiste los cambios entre aperturas', async () => {
  const record = await store.create('productos_servicios', sampleProduct);
  const reopened = await createDemoStore(path.join(directory, 'demo.json'));
  assert.equal(
    (await reopened.find('productos_servicios', record.id)).nombre,
    sampleProduct.nombre,
  );
  await reopened.close();
  await store.remove('productos_servicios', record.id);
});
