# MAZ Suplementos

Aplicación administrativa escolar con React, Vite, Express y TiDB. Incluye login, JWT, tres roles, CRUD de usuarios y suplementos/servicios, interfaz adaptable y respaldos JSON locales.

**El entorno principal está conectado a TiDB real.** La conexión TLS, las tablas, el administrador inicial, el CRUD, los permisos y el respaldo se verificaron contra `maz_suplementos`. Las credenciales permanecen en `backend/.env`, excluido de Git. Las pruebas automáticas habituales siguen usando datos temporales aislados.

## Ejecutar desde VS Code / PowerShell

Requisito: Node.js 22.12 o superior. Este equipo tiene Node.js 24.14.0.

```powershell
Set-Location 'C:\Users\Eh994\Desktop\MAZSUPLEMENTOS'
npm.cmd install
npm.cmd run setup
```

`setup` crea los archivos `.env` y un secreto JWT aleatorio sin sobrescribir configuraciones existentes. Se usa `npm.cmd` porque PowerShell puede bloquear `npm.ps1`; no hace falta cambiar la política del sistema.

Completa TiDB y los datos del primer administrador según [la guía de conexión](docs/TIDB.md), después ejecuta:

```powershell
npm.cmd run db:init
npm.cmd run db:check
npm.cmd run seed:admin
npm.cmd run dev
```

Abre **http://localhost:5173** y entra con tu administrador. Crea una cuenta de capturista y otra de auditor desde Usuarios. El backend escucha en `http://127.0.0.1:3000`; Vite reenvía `/api` al backend. Detén ambos con `Ctrl+C`.

## Roles exactos

| Rol           | Usuarios               | Suplementos y servicios | Respaldos                  |
| ------------- | ---------------------- | ----------------------- | -------------------------- |
| administrador | GET, POST, PUT, DELETE | GET                     | GET historial y POST crear |
| capturista    | Sin acceso             | GET, POST, PUT, DELETE  | Sin acceso                 |
| auditor       | GET                    | GET                     | Sin acceso                 |

Los permisos se validan en Express para cada operación, además de proteger rutas y ocultar acciones en React. El administrador no puede editar productos ni borrar/desactivar su propia cuenta o cambiar su propio rol.

## Pantallas

- Login con correo, contraseña, control para mostrarla y errores de acceso.
- Inicio con nombre, rol, indicadores calculados, registros recientes y accesos disponibles.
- Usuarios con búsqueda, filtros, paginación, información individual y CRUD de administrador.
- Suplementos y servicios con búsqueda, filtros, paginación y CRUD de capturista.
- Respaldos con creación, historial, fecha, nombre de archivo y tamaño, exclusivo de administrador.
- Acceso restringido y página no encontrada para navegación manual sin permiso.

Los precios se muestran en MXN. No se agregaron campos al esquema solicitado.

## Arquitectura y carpetas

```text
React + Router + Axios → API REST Express → mysql2 → TiDB con TLS
                             │
                   JWT + permisos + validación
                             │
                   respaldos JSON del servidor
```

```text
backend/
  src/config/        Entorno y conexión TLS
  src/controllers/   Autenticación y CRUD
  src/middleware/    Sesión, roles y errores
  src/models/        Adaptadores TiDB y demo de pruebas
  src/routes/        Endpoints y permisos
  src/services/      Respaldos
  src/utils/         Validación y respuestas
  src/app.js         Aplicación Express
  src/server.js      Inicio del servidor
  scripts/           Conexión, tablas y primer administrador
  sql/schema.sql     Tablas TiDB
  test/              Pruebas de API y SQL
  backups/           Copias privadas, excluidas de Git
frontend/src/
  components/        Menú, modales y elementos reutilizables
  context/           Sesión y notificaciones
  pages/             Pantallas
  routes/            Rutas protegidas
  services/          Axios y formatos
  styles/            CSS adaptable
docs/                TiDB, API, Postman y examen
scripts/             Configuración y servidor de pruebas
tests/               Pruebas de navegador
```

Npm workspaces permite instalar todo desde la raíz, conservando frontend y backend separados. `concurrently` inicia ambos con un comando. El adaptador local permite pruebas sin credenciales; el servidor nunca cambia a demo automáticamente si falla TiDB.

## Seguridad

- Bcrypt con coste 12, mínimo 10 caracteres y máximo 72 bytes. La base almacena hashes, nunca contraseñas en texto plano.
- JWT HS256 de dos horas, emisor y audiencia. El navegador lo guarda en `sessionStorage` y lo elimina al salir.
- Cada solicitud consulta el usuario actual: los cambios de rol se aplican inmediatamente y las cuentas inactivas/eliminadas pierden acceso. Cambiar contraseña invalida los JWT anteriores.
- Consultas parametrizadas, tablas y columnas limitadas, validación estricta de cuerpos e identificadores.
- Correo único, precio no negativo y máximo dos decimales, protección de la propia cuenta de administrador.
- Helmet, CORS, límite JSON de 32 KB y límites de solicitudes para login y respaldos.
- Errores consistentes sin exponer detalles SQL, contraseñas ni hashes en la API de usuarios.
- TLS con verificación de certificados de TiDB siempre activa.
- `.env`, respaldos, certificados PEM y datos de demo excluidos de Git. El frontend no contiene credenciales de TiDB.

Al salir se borra el JWT del navegador. Una copia del token sigue vigente hasta expirar o hasta cambiar la contraseña/desactivar/eliminar el usuario; este proyecto no implementa una lista de revocación por logout.

## Respaldos

JSON permite exportar con mysql2 sin instalar herramientas de dump. TiDB se lee en una transacción con aislamiento repetible para obtener ambas tablas de forma consistente. La escritura usa un archivo temporal y luego un renombrado.

El archivo contiene versión, fecha, origen (`tidb` o `demo`), usuarios con hashes bcrypt y productos/servicios. Queda en `backend/backups/` **del equipo que ejecuta el servidor**. La interfaz muestra metadatos; no hay descarga pública de los datos personales.

Es una copia lógica de las dos tablas, no del clúster completo, índices o configuración de TiDB. El esquema está en `backend/sql/schema.sql`. No incluye restauración automática; valida e importa cualquier copia en una base de prueba antes de usarla para recuperación. Conserva los archivos en un lugar privado.

## Comandos

| Comando                  | Función                                         |
| ------------------------ | ----------------------------------------------- |
| `npm.cmd run setup`      | Crear `.env` sin sobrescribir                   |
| `npm.cmd run dev`        | API + Vite                                      |
| `npm.cmd run db:init`    | Crear base y tablas sin borrar datos            |
| `npm.cmd run db:check`   | Probar TLS y versión de TiDB                    |
| `npm.cmd run seed:admin` | Crear administrador mediante variables privadas |
| `npm.cmd test`           | Pruebas de API, permisos, respaldos y SQL       |
| `npm.cmd run build`      | Compilar React en `frontend/dist`               |
| `npm.cmd start`          | Servir API y frontend compilado en puerto 3000  |
| `npm.cmd run test:e2e`   | Pruebas en navegador con datos temporales       |

Para usar el navegador de pruebas instala Chromium una vez:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

O usa Microsoft Edge si está instalado:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

Las pruebas E2E usan los puertos 3001 y 5174, archivos temporales y cuentas de prueba. No modifican `.env` ni TiDB. Si cambias `PORT` del backend normal, ajusta `API_PROXY_TARGET` para Vite o su configuración.

## Demo opcional

La configuración principal permanece en `DATA_MODE=tidb`. Para una demostración sin conexión cambia explícitamente a `DATA_MODE=demo` en `backend/.env` y reinicia. Aparecerá una franja **Demo local**; los datos quedan en `backend/data/demo.json`.

Solo si ese archivo aún no existe se crean `admin@maz.local`, `capturista@maz.local` y `auditor@maz.local`, con contraseña de demostración `MazDemo2026!`. Nunca se insertan en TiDB. Demo no se permite con `NODE_ENV=production`.

## Documentación

- [Conexión con TiDB](docs/TIDB.md)
- [Endpoints y ejemplos HTTP](docs/API.md)
- [Colección Postman](docs/MAZ.postman_collection.json)
- [Ejemplos REST Client](docs/requests.http)
- [Guion y conceptos para el examen](docs/EXAMEN.md)
- [Resultados y verificación real de TiDB](docs/VERIFICACION.md)

Referencias oficiales: [TiDB y mysql2](https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-mysql2/), [errores asíncronos en Express 5](https://expressjs.com/en/guide/error-handling/) y [Vite](https://vite.dev/guide/).
