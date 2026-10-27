# PP3 – Sistema de Mesa de Ayuda

PP3 es un sistema de mesa de ayuda para gestionar tickets de incidentes y requerimientos. Permite definir acuerdos de nivel de servicio (SLA), organizar el trabajo en grupos de soporte y armar vistas personalizables de la cola. Incluye una base de conocimiento de soluciones, notificaciones y un modelo de roles y permisos (RBAC) para controlar qué puede hacer cada usuario.

## Stack

**Backend:** Node.js, Express 5, mysql2 (MySQL o MariaDB, pensado para correr con XAMPP), JWT (`jsonwebtoken`), bcryptjs, multer y nodemailer.

**Frontend:** React 18, TypeScript, Vite y MUI (Material UI).

## Estructura de carpetas

```text
backend/
├── controllers/   Lógica de cada recurso (auth, tickets, SLA, grupos, roles, soluciones, notificaciones).
├── routes/        Definición de las rutas HTTP y qué controlador atienden.
├── middleware/    Autenticación JWT, control de técnicos y subida de archivos (multer).
├── rbac/          Permisos, servicio de roles y guardas de acceso.
├── utils/         SLA, grupos, mail, notificaciones, adjuntos, historial y reglas de resolución.
├── db/            Conexión a MySQL, volcado pp3.sql y la guía para crear el primer admin.
└── uploads/       Archivos subidos en tickets y soluciones (no se versiona).

frontend/
├── public/        Archivos estáticos servidos tal cual (logo).
└── src/           Aplicación React: pantallas en app/, helpers en lib/ y estilos en styles/.
```

## Requisitos previos

- Node.js 20 o superior.
- XAMPP con MySQL (o MariaDB) en marcha.

## Instalación y ejecución

1. En phpMyAdmin (o con el cliente de MySQL de XAMPP), creá la base `pp3`.
2. Importá el volcado `backend/db/pp3.sql` en esa base.
3. Copiá las plantillas de entorno:
   - `backend/.env.example` → `backend/.env`
   - `frontend/.env.example` → `frontend/.env`
4. Completá `backend/.env` (secreto JWT y, si vas a enviar mails, la cuenta de Gmail). El frontend ya apunta al API local.
5. Instalá dependencias e iniciá cada parte en su propia terminal:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

El API queda en [http://localhost:3000](http://localhost:3000) y el portal en [http://localhost:5173](http://localhost:5173).

## Variables de entorno

### Backend (`backend/.env.example`)

| Variable | Para qué sirve |
| --- | --- |
| `DB_HOST` | Host de MySQL/MariaDB. |
| `DB_USER` | Usuario de la base. |
| `DB_PASSWORD` | Contraseña de ese usuario (vacía en un XAMPP típico). |
| `DB_NAME` | Nombre de la base (`pp3`). |
| `JWT_SECRET` | Secreto para firmar y verificar los tokens de sesión. |
| `PORT` | Puerto HTTP del API. Si queda vacío, el servidor usa 3000. |
| `GMAIL_USER` | Cuenta de Gmail que envía los correos (recuperación de contraseña y avisos). |
| `GMAIL_APP_PASSWORD` | Clave de aplicación de 16 caracteres de esa cuenta (verificación en 2 pasos). |
| `MAIL_FROM_NAME` | Nombre que aparece como remitente. |
| `FRONTEND_URL` | URL del portal, usada en los enlaces de los mails. |

### Frontend (`frontend/.env.example`)

| Variable | Para qué sirve |
| --- | --- |
| `VITE_API_URL` | URL base del API, sin barra final. El cliente la lee como `import.meta.env.VITE_API_URL`. |

## Primer administrador

El registro del portal crea usuarios comunes. Para el primero con rol de administración:

1. Registrate en [http://localhost:5173](http://localhost:5173).
2. En MySQL, asigná el rol (reemplazá el correo):

```sql
UPDATE pp3.users SET role = 'admin' WHERE email = 'correo@ejemplo.com';
```

3. Cerrá sesión y volvé a entrar. El portal te lleva al panel de administración. Desde ahí podés promover a otros usuarios sin tocar la base.

La guía completa, con terminal, Workbench y phpMyAdmin, está en [backend/db/CREAR_ADMIN.md](backend/db/CREAR_ADMIN.md).

## Autor

Luciano Tarizzo — [Analisis de Sistemas]
