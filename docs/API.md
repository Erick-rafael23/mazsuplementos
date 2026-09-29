# API REST y pruebas manuales

Base: `http://127.0.0.1:3000/api`. Cuerpos JSON. Todas las rutas salvo login/health requieren `Authorization: Bearer TU_TOKEN`.

```json
{ "success": true, "message": "Registro creado correctamente", "data": {} }
```

```json
{ "success": false, "message": "No tienes permisos para realizar esta operación." }
```

## Relación entre botones y endpoints

| Método | Ruta           | Acción                          | Rol                    |
| ------ | -------------- | ------------------------------- | ---------------------- |
| GET    | /health        | Estado y modo                   | Público                |
| POST   | /auth/login    | Entrar a mi tienda              | Credenciales válidas   |
| GET    | /auth/me       | Recuperar sesión                | Autenticado            |
| GET    | /usuarios      | Abrir Usuarios                  | Administrador, auditor |
| GET    | /usuarios/:id  | Ver / cargar edición            | Administrador, auditor |
| POST   | /usuarios      | Nuevo usuario → Crear registro  | Administrador          |
| PUT    | /usuarios/:id  | Editar → Guardar cambios        | Administrador          |
| DELETE | /usuarios/:id  | Eliminar → confirmar            | Administrador          |
| GET    | /productos     | Abrir catálogo o inicio         | Todos                  |
| GET    | /productos/:id | Ver / cargar edición            | Todos                  |
| POST   | /productos     | Nuevo registro → Crear registro | Capturista             |
| PUT    | /productos/:id | Editar → Guardar cambios        | Capturista             |
| DELETE | /productos/:id | Eliminar → confirmar            | Capturista             |
| GET    | /backups       | Abrir historial                 | Administrador          |
| POST   | /backups       | Crear respaldo                  | Administrador          |

La búsqueda, filtros y paginación operan en el navegador sobre la lista consultada. Para un catálogo grande convendría paginación en SQL.

## Login

```http
POST /api/auth/login
Content-Type: application/json

{"correo":"TU_CORREO","password":"TU_CONTRASEÑA"}
```

Respuesta 200: `data.token` y `data.usuario`, sin hash ni contraseña. Copia el token a **Authorization → Bearer Token** en Postman o Thunder Client. Expira a las dos horas.

## Crear usuario (administrador)

```json
{
  "nombre": "Capturista de prueba",
  "correo": "capturista-prueba@example.com",
  "password": "UnaClaveDePrueba2026!",
  "rol": "capturista",
  "activo": true
}
```

POST `/usuarios` con ese cuerpo devuelve 201 y el `id`. Usa una contraseña propia para cuentas reales. PUT `/usuarios/:id` recibe nombre, correo, rol y activo; password es opcional. Omítela para conservarla, no envíes cadena vacía. DELETE elimina el registro indicado y devuelve 200.

## Crear/actualizar suplemento (capturista)

POST `/productos`, después PUT `/productos/ID_DEVUELTO`, con el siguiente cuerpo:

```json
{
  "nombre": "Creatina monohidratada 300 g",
  "descripcion": "Sin sabor. Presentación de 300 g.",
  "tipo": "producto",
  "precio": 449.0,
  "activo": true
}
```

Cambia el precio a 429.00 para demostrar PUT. GET `/productos/ID_DEVUELTO` consulta la información. DELETE `/productos/ID_DEVUELTO` elimina el registro de prueba; el GET posterior devuelve 404. Tipo acepta producto o servicio.

## Respaldos

POST `/backups` con token de administrador y cuerpo `{}` devuelve 201 con `nombre`, `fecha`, `bytes` y `registros`. GET devuelve el historial. El archivo está en `backend/backups/`, sin endpoint público de descarga.

## Códigos y pruebas negativas

- 200: consulta, login, actualización o eliminación correcta.
- 201: usuario/producto/respaldo creado.
- 400: precio negativo, rol/tipo inválido, cuerpo o identificador incorrecto.
- 401: sin token, token vencido, credenciales incorrectas o cuenta inactiva.
- 403: capturista consulta/borra usuarios; administrador modifica productos; auditor modifica cualquier catálogo; capturista/auditor usa backups.
- 404: registro o endpoint inexistente.
- 409: correo duplicado o intento de borrar/desactivar la propia cuenta/cambiar su rol.
- 413: cuerpo JSON mayor a 32 KB.
- 429: exceso de intentos de login o creación de respaldos.
- 500: error interno, sin datos sensibles en la respuesta.

## Postman, Thunder Client y VS Code

Importa `MAZ.postman_collection.json` en Postman. Configura `correo` y `password` en tu entorno privado. Login guarda automáticamente `token`; los POST de creación guardan los ids para las siguientes solicitudes. No exportes secretos.

En Thunder Client crea solicitudes con la tabla anterior, selecciona JSON y configura Auth → Bearer Token. `requests.http` incluye solicitudes listas para la extensión REST Client de VS Code.

La colección contiene acciones DELETE: utiliza solo cuentas y productos de prueba. No ejecutes toda la colección sin revisar roles y variables.
