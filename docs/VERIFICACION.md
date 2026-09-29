# Verificación del proyecto

Fecha: 28 de septiembre de 2026.

| Comprobación                              | Resultado                                                  |
| ----------------------------------------- | ---------------------------------------------------------- |
| `npm.cmd test`                            | 39 pruebas correctas, 0 fallos                             |
| `npm.cmd run build`                       | Compilación de React correcta                              |
| `npm.cmd run test:e2e` con Microsoft Edge | 4 pruebas correctas, 0 fallos                              |
| Vista de escritorio y móvil               | Capturas revisadas; sin desbordamiento horizontal en móvil |
| Conexión real con TiDB                    | Correcta con TLS; base maz_suplementos                     |
| Crear tablas y administrador en TiDB      | Tablas creadas y administrador inicial habilitado          |
| CRUD y permisos contra TiDB real          | Login, POST, GET, PUT, DELETE y restricciones correctos    |
| Respaldo de TiDB                          | Archivo JSON local generado y verificado                   |

Las pruebas de API cubren la matriz de permisos por método HTTP, login, JWT, usuarios inactivos, cambios de rol/contraseña, validaciones, correos duplicados, protección de la propia cuenta y generación de respaldos con hashes bcrypt.

Las pruebas SQL verifican que los datos se pasen como parámetros y que el respaldo use transacción, rollback y liberación de conexión. Se ejecutan con dobles de prueba, no con el clúster remoto.

Las pruebas de navegador ejecutan el CRUD de usuarios como administrador, CRUD de productos como capturista, consultas como auditor, acceso restringido mediante URL, cierre/recuperación de sesión y navegación móvil. Usan datos temporales y no modifican TiDB.

Capturas generadas localmente: `test-results/dashboard-desktop.png`, `test-results/dashboard-mobile.png` y `test-results/respaldos.png`. Esta carpeta se excluye de Git.

La verificación adicional real utilizó la API Express con mysql2 conectado a TiDB: creó cuentas temporales de capturista/auditor y un producto, comprobó el precio actualizado mediante SELECT directo, verificó rechazos 403 y eliminó únicamente esos registros temporales. Se confirmó que el respaldo indica `origen: tidb`, contiene hashes bcrypt y no contiene la contraseña de acceso en texto plano. La cuenta inicial del administrador se conserva.

El servidor reportó `8.0.11-TiDB-v8.5.3-serverless`. Para repetir la comprobación de conexión sin modificar datos, ejecuta `npm.cmd run db:check`. La guía `TIDB.md` explica la configuración para otra instalación; no es necesario recrear el administrador de este entorno.
