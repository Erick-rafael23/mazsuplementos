import { test, expect } from '@playwright/test';

async function login(page, correo) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill('MazDemo2026!');
  await page.getByRole('button', { name: 'Entrar a mi tienda' }).click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
}

test('administrador gestiona usuarios, consulta catálogo y crea respaldos', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, 'admin@maz.local');
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre', { exact: true }).fill('Persona de prueba');
  await dialog.getByLabel('Correo electrónico').fill('persona-e2e@example.com');
  await dialog.getByLabel('Contraseña', { exact: true }).fill('UnaClaveSegura2026!');
  await dialog.getByRole('combobox', { name: 'Rol', exact: true }).selectOption('auditor');
  await dialog.getByRole('button', { name: 'Crear registro' }).click();
  await expect(
    page.getByRole('cell', { name: 'persona-e2e@example.com', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar Persona de prueba', exact: true }).click();
  await dialog.getByLabel('Nombre', { exact: true }).fill('Persona actualizada');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(
    page.getByRole('button', { name: 'Ver Persona actualizada', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver Persona actualizada', exact: true }).click();
  await expect(dialog.getByText('persona-e2e@example.com')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Persona actualizada', exact: true }).click();
  await dialog.getByRole('button', { name: 'Eliminar registro' }).click();
  await expect(
    page.getByRole('cell', { name: 'persona-e2e@example.com', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Suplementos y servicios', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nuevo registro' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Respaldos', exact: true }).click();
  await page.getByRole('button', { name: 'Crear respaldo' }).click();
  await expect(
    page.getByText('Respaldo creado correctamente', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: /backup_.*\.json/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/respaldos.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('capturista completa CRUD de suplementos y no accede a usuarios o respaldos', async ({
  page,
}) => {
  await login(page, 'capturista@maz.local');
  await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Suplementos y servicios', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo registro' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre', { exact: true }).fill('Proteína E2E');
  await dialog.getByLabel('Descripción').fill('Presentación de prueba');
  await dialog.getByLabel('Precio (MXN)').fill('589.50');
  await dialog.getByRole('button', { name: 'Crear registro' }).click();
  await expect(page.getByRole('button', { name: 'Ver Proteína E2E', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar Proteína E2E', exact: true }).click();
  await dialog.getByLabel('Precio (MXN)').fill('599');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(
    page.getByRole('row').filter({ hasText: 'Proteína E2E' }).getByText('$599.00'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar Proteína E2E', exact: true }).click();
  await dialog.getByRole('button', { name: 'Eliminar registro' }).click();
  await expect(page.getByRole('button', { name: 'Ver Proteína E2E', exact: true })).toHaveCount(0);
  await page.goto('/usuarios');
  await expect(
    page.getByRole('heading', { name: 'Este espacio requiere otro permiso' }),
  ).toBeVisible();
  await page.goto('/respaldos');
  await expect(
    page.getByRole('heading', { name: 'Este espacio requiere otro permiso' }),
  ).toBeVisible();
});

test('auditor solo consulta y conserva sesión al recargar', async ({ page }) => {
  await login(page, 'auditor@maz.local');
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nuevo usuario' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Editar / })).toHaveCount(0);
  await page.getByLabel('Buscar usuarios').fill('María');
  await expect(page.getByRole('button', { name: 'Ver María López' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Suplementos y servicios', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nuevo registro' })).toHaveCount(0);
  await page.getByLabel('Buscar productos').fill('inexistente-123');
  await expect(page.getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});

test('dashboard y navegación funcionan en móvil sin desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'admin@maz.local');
  await expect(page.getByText('Total del catálogo', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: 'Inicio', exact: true }).click();
  await expect(page.getByText('Total del catálogo', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
});
