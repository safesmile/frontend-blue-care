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

## Colaboradores y pacientes: páginas separadas

- /colaboradores usa el directorio real de personal, con clínicas/roles visibles y alcance del operador. Los pacientes no aparecen como colaboradores por tener cuenta.
- /colaboradores/invitar es una página completa con contacto, clínica y rol de trabajo. Las opciones provienen de la validación de delegación del backend; el formulario no permite conceder roles globales ni elegir tipo de cuenta.
- /colaboradores/:id/acceso administra acceso por sede con las operaciones existentes PUT/DELETE clinics/:id/staff/:userId. Conserva el resto de asignaciones y dispara los avisos/auditoría del backend.
- /colaboradores/:id/editar permite a gestores globales autorizados editar nombres/estado de la identidad, sin selector de roles globales.
- /pacientes lista fichas clínicas reales y permite abrir su edición o invitación al contacto registrado. No usa datos ilustrativos de AdministrationPage.
- /pacientes/invitar es otra página completa, sin campos de roles ni asignaciones de personal. El servidor fija el rol Paciente (customer). Usa la clínica de trabajo seleccionada para registrar/reutilizar la ficha; en Todas muestra la instrucción y bloquea el envío hasta seleccionar una sede. No concede al paciente acceso institucional ni una clínica en su JWT.
- /pacientes/:id/editar administra contacto/ficha. Respeta el vínculo de cuenta y el correo verificado; no reemplaza cuentas ni sus roles.
- /colaboradores/invitaciones y /pacientes/invitaciones son historiales separados por invitations.kind en el servidor, con paginación, estados, correo, reenvío/cooldown y revocación con motivo opcional. Un resultado de envío ambiguo exige revisar historial, sin duplicar automáticamente el envío.
- /usuarios y /usuarios/invitaciones redirigen a las páginas de colaboradores. Los formularios de invitación, edición y acceso nuevos no usan modales. Los componentes anteriores de usuarios quedan fuera de estas rutas; sus utilidades y pruebas de compatibilidad permanecen.

Los endpoints específicos son POST /auth/invitations/patients y /auth/invitations/collaborators. El paciente no requiere roles:assign porque el servidor asigna exclusivamente el rol personal fijo. El colaborador sí requiere autoridad de delegación/gestión de la clínica. GET /auth/invitations/collaborators/roles?clinicId=… suministra opciones autorizadas, y GET /users/collaborators limita listado y detalle por permisos de clínica. Nunca se envían passwords de los invitados ni un actor del cliente.

Ver contratos y transición del esquema en ../api-blue-dent/docs/people-management.md. Se conservan una cuenta de acceso y perfiles clínicos/laborales separados. No hay cambio de tipo elegido por el usuario ni creación automática de membresía.

Comprobaciones: npm run test:people, test:auth, test:users, build y lint. Las 58 pruebas del frontend cubren contratos y aislamiento; también se comprobaron visualmente las páginas de invitación contra la API local, sin enviar invitaciones reales. Persisten las advertencias anteriores del template. Las otras pantallas de negocio pendientes siguen siendo ilustrativas hasta su integración específica.

## Sesiones de paciente y personal (05/11/2026)

El backend determina automáticamente el contexto de acceso (paciente/personal) mediante perfiles y permisos al iniciar sesión. El cliente no elige tipo: login no envía ni acepta mode, no hay selector de paciente/personal ni ruta auth/switch-mode. El discriminador mode de la respuesta/JWT es interno y se valida contra la sesión. Paciente accede a recursos propios sin clínica en el JWT; personal recibe clínicas activas asignadas y permisos por sede.

El selector de clínica usa user.clinics de auth/me, sin sedes ficticias. POST auth/switch-clinic envía el refresh actual y clinicId (UUID o null para Todas las asignadas). El cambio de clínica sustituye token y refreshToken en una sola escritura, antes de consultar el nuevo contexto. Las respuestas anteriores se descartan y no se repiten escrituras contra otra sede; el contenido de las pantallas se desmonta durante el cambio y se vuelve a cargar con los permisos nuevos.

Sin clínicas disponibles se muestra No hay clínicas seleccionadas en el selector deshabilitado y en /mi-cuenta, junto con una explicación. Personal sin sedes conserva perfil/seguridad y administración de plataforma si tiene esos permisos. Patient no muestra selector de clínicas. Actualizar accesos y recuperar foco vuelven a consultar el perfil; no se persisten permisos, roles o datos de clínicas en el navegador.

Los flujos nuevos envían contacto y los campos específicos de paciente o colaborador, según se describe arriba. La condición de personal no desaparece al retirar su última sede. El endpoint genérico se conserva como compatibilidad del backend, sin ser el formulario de estas rutas.

Menú, búsqueda y acceso directo a rutas administrativas respetan modo/permisos; usuarios sin dashboard autorizado aterrizan en /mi-cuenta. El backend sigue siendo la autoridad. Pacientes, membresías, planes y demás pantallas ilustrativas todavía requieren su integración de negocio; esta adaptación conecta autenticación, contexto, selector, perfil e invitaciones.

El template actual ya no contiene el proveedor i18next que describía AGENTS.md. No se instaló una dependencia: los textos nuevos de sesión se guardan en src/messages/{es,en,de,ar}.json y se resuelven con el idioma del documento, español como reserva. Las pantallas históricas conservan su idioma actual.

Verificación: 38 pruebas de autenticación/contexto y 16 de usuarios, build y lint sin errores. El lint conserva advertencias existentes en componentes del template; la compilación advierte del tamaño del bundle. QA en navegador contra la API local: login de personal sin sedes, aviso en perfil, selector deshabilitado y cambio a paciente sin selector de clínica. Los contratos, aislamiento y concurrencia del cambio de sede se comprueban con pruebas automatizadas; no se crearon clínicas ficticias en la base local para esta comprobación visual.

Contrato completo del backend: ../api-blue-dent/docs/clinic-context.md. Tras actualizar ambos proyectos, iniciar sesión de nuevo si quedan credenciales antiguas.

Corrección DN-19 (06/11/2026): eliminado el selector de paciente/personal y la API correspondiente. El selector de clínicas ahora usa Select de Base UI ya incluido, con icono, etiqueta, menú personalizado, opción marcada, teclado, tema oscuro y estado deshabilitado sin sedes. Conserva la ruta actual cuando sigue autorizada; cambia a una ruta permitida si los nuevos permisos no la admiten. No hay dependencias nuevas. QA en navegador contra la API local: selección con ratón y retorno a Todas por teclado. 38 pruebas de autenticación y 16 de usuarios aprobadas; build y lint sin errores, con las advertencias anteriores del template.

### Directorios y tablas

El listado /pacientes usa la API clínica. La ficha /pacientes/:id tiene su propio permiso de lectura, distinto del listado y de la edición. El rol admin inicial puede listar y leer fichas solo dentro de sus clínicas asignadas.

Las tablas del panel usan `DynamicTable`, con 10 filas por defecto, hasta 25 por página y el total de registros sobre la tabla. Define las columnas con `TableColumn` y las acciones por fila con `TableAction`. Las columnas pueden usar valores tipados o celdas personalizadas. Las acciones aceptan enlaces o funciones y etiquetas accesibles con tooltip.

Pasa `rows` para filtrar, ordenar y paginar datos locales, o `load` para consultar un listado del servidor. `listSearchParams` serializa el contrato compartido y el cargador devuelve `{ items, total }`. Para los listados del servidor, los identificadores de columnas filtrables u ordenables deben coincidir con los campos que admite el recurso.
