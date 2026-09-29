# Presentación del examen

## Preparación

Ejecuta `npm.cmd run db:check`, `npm.cmd test` y `npm.cmd run build`. Inicia `npm.cmd run dev`. Prepara cuentas de administrador, capturista y auditor; usa datos de prueba al proyectar pantalla. Importa la colección de Postman o prepara Thunder Client con `API.md`.

## Guion de 8–10 minutos

1. Muestra frontend y backend separados. Explica React → Express → mysql2 → TiDB con TLS.
2. Inicia como administrador. Muestra nombre/rol, crea un usuario, búscalo, consulta, edita y elimina la cuenta de prueba. En Network del navegador identifica POST, GET, PUT y DELETE. Productos solo permite consultar.
3. Inicia como capturista. No aparecen usuarios ni respaldos. Crea una proteína, cambia el precio, consulta y elimina. Muestra que TiDB persiste los registros.
4. Inicia como auditor. Puede consultar ambos catálogos sin editar. Escribe `/respaldos` en la URL y muestra acceso restringido.
5. En Postman usa el token de capturista para DELETE usuarios: debe responder 403. Explica que los permisos se verifican aunque alguien llame directamente al servidor.
6. Como administrador crea un respaldo, muestra fecha/nombre y archivo en VS Code. Explica que contiene hashes y datos de ambas tablas. No proyectes datos personales reales.
7. Demuestra correo repetido, precio negativo y login incorrecto: respuestas 409, 400 y 401.

## Conceptos

| Concepto               | Qué significa aquí                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------ |
| API REST               | Interfaz HTTP que opera con recursos como usuarios y productos                       |
| Endpoint               | Método y dirección; por ejemplo GET /api/productos                                   |
| Middleware             | Función que revisa la solicitud antes del controlador                                |
| Autenticación          | Verificar quién inicia sesión                                                        |
| Autorización           | Verificar las acciones permitidas para su rol                                        |
| Rol                    | Administrador, capturista o auditor, cada uno con permisos definidos                 |
| JWT                    | Token firmado que acredita la sesión por tiempo limitado                             |
| Hash bcrypt            | Transformación no reversible para comparar contraseñas sin guardarlas en texto plano |
| Consulta parametrizada | SQL y valores separados para evitar ejecutar datos como instrucciones                |
| TLS                    | Cifra la conexión y verifica al servidor TiDB                                        |
| CRUD                   | Crear, consultar, actualizar y eliminar                                              |
| Transacción            | Unidad consistente usada al leer las tablas para el respaldo                         |

## Pruebas y alcance

`npm.cmd test` verifica API, roles, validaciones, JWT y respaldos con archivos temporales. Las pruebas SQL revisan parametrización/transacciones con dobles de prueba. No sustituyen la verificación del clúster real. `npm.cmd run test:e2e` comprueba los flujos desde un navegador y la navegación móvil, sin tocar TiDB.

El alcance es administrativo: no incluye pagos, ventas, pedidos, inventario por cantidades ni recomendaciones médicas. Las copias JSON abarcan las dos tablas, sin restauración automática. Para publicar en internet se debe configurar HTTPS en el alojamiento y definir retención de respaldos.
