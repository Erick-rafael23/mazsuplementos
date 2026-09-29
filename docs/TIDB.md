# Conectar MAZ con TiDB real

## 1. Obtener datos

Abre **TiDB Cloud → tu clúster → Connect**. Copia host, puerto, usuario y contraseña. Si aún no tienes contraseña, usa la opción de generarla o establecerla. Si tu modalidad tiene una lista de IP permitidas, agrega tu IP pública actual. Si requiere certificado CA, descárgalo.

Consulta la [guía oficial de TiDB](https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-mysql2/) si las opciones varían según el tipo de clúster.

## 2. Preparar `.env`

Desde la raíz, `npm.cmd run setup` crea los archivos y un secreto JWT aleatorio sin sobrescribir archivos existentes. Edita `backend/.env` en VS Code:

```dotenv
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
DATA_MODE=tidb
FRONTEND_ORIGIN=http://localhost:5173
TIDB_HOST="PEGA_EL_HOST"
TIDB_PORT=4000
TIDB_USER="PEGA_EL_USUARIO"
TIDB_PASSWORD="PEGA_LA_CONTRASEÑA"
TIDB_DATABASE=maz_suplementos
TIDB_CA_PATH=
JWT_SECRET="CONSERVA_EL_VALOR_GENERADO_POR_SETUP"
ADMIN_NAME="Tu nombre"
ADMIN_EMAIL="tu-correo@ejemplo.com"
ADMIN_PASSWORD="ELIGE_UNA_CONTRASEÑA_PROPIA"
```

Los textos de ejemplo son indicaciones, no credenciales válidas. No los copies literalmente como valores definitivos.

- Copia el puerto real de TiDB, aunque sea diferente de 4000.
- `TIDB_DATABASE` es la base que crearemos; usa `maz_suplementos` o el nombre de una base autorizada existente. Solo letras, números y guion bajo.
- CA puede quedar vacío si Node reconoce el certificado. Si TiDB entrega CA, coloca su ruta, por ejemplo `C:/Users/Eh994/certificados/tidb-ca.pem`. No desactives su verificación.
- Usa comillas para valores con espacios o `#`.
- Conserva el secreto JWT aleatorio generado, no el texto de ejemplo.
- Los datos `ADMIN_*` crean tu acceso a MAZ; son distintos de las credenciales del clúster. La contraseña debe tener al menos 10 caracteres y máximo 72 bytes.
- Nunca pongas estos datos en `frontend/.env`, en el chat o en GitHub.

## 3. Conexión mysql2

Ya está implementada en `backend/src/config/database.js`: pool de cinco conexiones, TLS 1.2 o superior, certificado validado, UTC y consultas parametrizadas. Para cambiar el clúster basta editar `.env` y reiniciar.

## 4. Crear tablas

```powershell
npm.cmd run db:init
```

Conecta sin seleccionar una base, ejecuta `CREATE DATABASE IF NOT EXISTS` y el SQL de `backend/sql/schema.sql`. Crea `usuarios` y `productos_servicios` sin borrar datos. Necesitas permisos de creación; si no los tienes, solicita al administrador del clúster ejecutar el mismo esquema en una base autorizada.

## 5. Comprobar conexión

```powershell
npm.cmd run db:check
```

Debe mostrar la versión, el nombre de la base y **Conexión TLS con TiDB verificada**, sin revelar contraseñas.

| Error                       | Qué revisar                              |
| --------------------------- | ---------------------------------------- |
| ENOTFOUND                   | Host, DNS e internet                     |
| ETIMEDOUT                   | IP autorizada, red y puerto              |
| ER_ACCESS_DENIED_ERROR      | Usuario, contraseña y permisos           |
| ER_BAD_DB_ERROR             | Nombre de base; ejecutar db:init         |
| Error de certificado        | CA entregada por TiDB y fecha del equipo |
| ER_NO_SUCH_TABLE al iniciar | Ejecutar db:init                         |

## 6. Primer administrador

Después de completar `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`:

```powershell
npm.cmd run seed:admin
```

El script aplica bcrypt antes del INSERT y no reemplaza cuentas existentes. No hay registro público. Después de crear la cuenta, retira `ADMIN_PASSWORD` de `.env`: ya no se necesita para iniciar la aplicación.

## 7. Comprobar escrituras reales desde VS Code

```powershell
npm.cmd run dev
```

1. Abre `http://localhost:5173`, inicia sesión y verifica el indicador **TiDB conectado**.
2. En Usuarios crea un capturista y un auditor.
3. Inicia como capturista y crea una creatina con precio 449.00. Edita su descripción.
4. Consulta el mismo registro con Thunder Client o Postman en `GET /api/productos` usando el token del capturista. Los ejemplos están en `docs/API.md`.
5. Reinicia el servidor y comprueba que el registro persista.
6. Opcionalmente abre el editor SQL de TiDB Cloud y ejecuta:

```sql
USE maz_suplementos;
SELECT id, nombre, correo, rol, activo FROM usuarios;
SELECT id, nombre, tipo, precio, activo FROM productos_servicios;
```

`GET /api/health` debe indicar `mode: "tidb"`. El servidor comprueba la tabla de usuarios al arrancar; no utiliza datos de demo si la conexión falla.

## 8. Verificar respaldo

Como administrador, abre Respaldos y presiona Crear respaldo. Revisa la fecha/nombre en la interfaz y el archivo bajo `backend/backups/` en VS Code. Su campo `origen` debe ser `tidb`. El archivo contiene datos privados y hashes; no lo publiques.
