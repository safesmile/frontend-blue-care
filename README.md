# BlueCare — Panel administrativo

React + TypeScript + Vite + Tailwind CSS. Diseño basado en los mockups del proyecto y componentes de TailAdmin. Interfaz en español, sin i18n.

## Desarrollo

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

## Rutas

| Ruta                            | Pantalla                            |
| ------------------------------- | ----------------------------------- |
| `/`                             | Blue Care hoy                       |
| `/pacientes`                    | Pacientes                           |
| `/pacientes/santiago-izquierdo` | Ficha del paciente y línea temporal |
| `/membresias`                   | Membresías                          |
| `/membresias/asignar`           | Asignar o renovar membresía         |
| `/planes`                       | Planes y versiones                  |
| `/planes/blue-care/beneficios`  | Configurar beneficios del plan      |
| `/beneficios`                   | Beneficios y consumos               |
| `/beneficios/registrar-consumo` | Registrar consumo                   |
| `/prevencion`                   | Prevención dental                   |
| `/clinicas`                     | Clínicas                            |
| `/usuarios`                     | Usuarios y permisos                 |
| `/auditoria`                    | Auditoría                           |
| `/iniciar-sesion`               | Iniciar sesión                      |
| `/recuperar-acceso`             | Recuperar acceso                    |
| `/verificar-identidad`          | Verificar identidad                 |

`/signin` redirige al login. Las rutas de correo se conservan según el contrato del backend. Las rutas desconocidas muestran una página 404.

## Estructura

`src/App.tsx` registra las rutas. `src/pages` contiene las pantallas y sus datos ilustrativos. `src/components/layout/app-layout` contiene el encabezado, búsqueda global, notificaciones, menú de usuario y navegación adaptable. Se conservan los componentes reutilizables de `src/components/ui` y los estilos de `src/index.css`.

Los logos originales están en `public/images/logo`. `BrandLogo` elige la variante según el tema resuelto. La primera visita utiliza el tema del sistema operativo; una selección manual se conserva en el navegador.

## Autenticación conectada

El módulo usa los contratos existentes de `api-blue-dent`, con prefijo `/api/v1`:

- Login: `POST auth/login` (`email`, `password`).
- Perfil/sesión: `GET auth/me`, `POST auth/refresh` y `POST auth/logout` (`refreshToken`).
- Recuperación: `POST auth/password/forgot` (`email`) y `POST auth/password/reset` (`token`, `password`).
- Activación: `POST auth/activation/request` (`email`) y `POST auth/activation/confirm` (`token`, `password`).
- Invitación: `GET auth/invitations/by-token?token=…`, seguido de `POST auth/invitations/accept` (`token`, `password`).
- Seguridad de la cuenta: `POST auth/password/change` (`currentPassword`, `newPassword`), `POST auth/email/change` (`email`, `currentPassword`) y `POST auth/email/confirm` (`token`).

Las rutas de correo `/accept-invitation`, `/reset-password`, `/activate-account` y `/confirm-email` leen el token de la URL sin redirigir ni perderlo. También existen las rutas en español `/aceptar-invitacion`, `/restablecer-contrasena`, `/configurar-contrasena` y `/confirmar-correo`. La confirmación de correo requiere pulsar el botón; abrir el enlace no consume el token automáticamente. Al completar una acción, se reemplaza la entrada del historial con el login y su mensaje de éxito.

`/solicitar-activacion` solicita activar una cuenta ya registrada; no hay registro público. `/verificar-identidad` y `/two-step-verification` conducen a esa solicitud, porque el backend verifica enlaces de correo y no expone un flujo de códigos de seis dígitos.

`/mi-cuenta` muestra el perfil real. Los enlaces de cambio de contraseña y correo se muestran según los permisos devueltos por el servidor. Toda ruta del panel requiere una sesión verificada con `auth/me`. Esta protección del navegador no sustituye la autorización del backend.

La sesión se conserva por pestaña en `sessionStorage`, con ambos tokens en una sola entrada; no se guardan contraseñas ni perfiles. Si el almacenamiento no está disponible, funciona solo en memoria. Las solicitudes privadas usan Bearer y renuevan ambos tokens una sola vez ante un 401, coordinando peticiones concurrentes. Un refresh inválido elimina la sesión; los fallos de red permiten reintentar. Logout revoca la sesión en el servidor; si falla, permite volver a intentarlo. Cambiar la contraseña o confirmar el correo exige iniciar sesión nuevamente.

## Conexión local

1. Iniciar la API siguiendo su README, con PostgreSQL y SMTP ya configurados. El frontend no ejecuta migraciones ni crea usuarios.
2. Copiar `.env.example` a `.env.local` si se necesitan valores distintos. Por defecto `VITE_API_URL=/api/v1` y el proxy de Vite apunta a `http://localhost:3000`.
3. Ejecutar `npm run dev`. Los enlaces de correo usan `FRONTEND_URL` del backend: debe coincidir con el origen y puerto donde se está ejecutando el frontend. La configuración actual del backend usa `http://localhost:5173`.
4. Si la API está en otro puerto, configurar `API_PROXY_TARGET` en `.env.local` y reiniciar Vite. Para llamadas directas a otro origen, establecer `VITE_API_URL` e incluir el origen del frontend en `CORS_ORIGINS` del backend.

En producción configurar un proxy `/api/v1` hacia la API, o una URL HTTPS explícita en `VITE_API_URL`. El alojamiento debe servir `index.html` en las rutas de la SPA conservando la consulta del enlace.

## Verificación

`npm run test:auth` ejecuta pruebas aisladas con Node y TypeScript ya incluidos en el proyecto. Comprueba contratos HTTP, renovación concurrente, revocación, errores de red, cambios de identidad y validaciones de contraseñas/tokens, sin base de datos ni SMTP reales. Ejecutar también `npm run build` y `npm run lint`.

## Módulos pendientes

Las demás pantallas siguen usando datos ilustrativos de los mockups. Sus filtros y formularios son locales; pacientes, membresías, planes, consumos y notificaciones todavía requieren integración propia. Los módulos de usuarios e invitaciones ya están conectados, según se detalla a continuación.

El template conserva su licencia en `LICENSE.md`.

## Usuarios e invitaciones

- `/usuarios`: listado real con `GET /users?limit=…&offset=…`, detalle de los datos recibidos, edición de nombres y roles con `PATCH /users/:id`, y habilitación/deshabilitación del acceso. Esta interfaz prioriza deshabilitar cuentas y conserva los registros; no ofrece borrado definitivo.
- `/usuarios/invitaciones`: historial real con `GET /auth/invitations?limit=…&offset=…`, estado, resultado de entrega, fechas e invitador. Permite envío con `POST /auth/invitations`, reenvío con `POST /auth/invitations/:id/resend` y revocación con `POST /auth/invitations/:id/revoke`.
- Los nombres y apellidos se envían por separado; las invitaciones no solicitan ni envían contraseñas, actor, tokens o permisos efectivos. El destinatario configura su contraseña mediante el enlace de aceptación.
- Los roles se obtienen de todas las páginas de `GET /roles`, excluyendo roles históricos y grants fuera de la autoridad del operador. Si el operador tiene `roles:assign` pero no `roles:list`, puede indicar los identificadores de roles existentes; el backend comprueba su existencia y delegación.
- Listar usuarios exige `users:list` y `users:manage`; las operaciones restantes comprueban su permiso propio. Editar otras identidades requiere alcance global y las cuentas superadmin están protegidas. Las opciones de invitaciones respetan `invitations:list/create/resend/revoke`, y enviar/reenviar exige también `roles:assign`.
- Los filtros de texto y estado son explícitamente **de la página actual**: la API solo admite `limit` y `offset`. Se muestra por separado el total del servidor y la cantidad visible de la página. No se inventan asignaciones de clínicas a partir de estos endpoints.
- Reenviar invalida el enlace anterior, da otras 24 horas y respeta 60 segundos desde el último intento de envío. Se admiten pendientes y vencidas; las aceptadas y revocadas permanecen como historial. La revocación requiere confirmación y admite motivo opcional para auditoría.
- Un fallo de correo puede devolver 503 después de guardar la invitación. Se actualiza el listado y se indica revisar el historial para reenviar, sin duplicar automáticamente la solicitud. Los fallos de conexión durante un envío se tratan como resultado no confirmado.

`npm run test:users` comprueba contratos HTTP, paginación de roles, campos de entrada, permisos, delegación, nombres y reglas de estado/reenvío con respuestas simuladas, sin SMTP ni cambios en la base real.
