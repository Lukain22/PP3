# Cómo crear un usuario administrador

Seguí estos 3 pasos para darle rol de admin a un usuario ya registrado en el sistema.

---

## Paso 1 — Registrá el usuario en el sistema

Antes de poder hacerlo admin, el usuario tiene que existir en la base de datos.
Entrá al portal (http://localhost:5173) y registralo desde la pantalla de login,
o pedile que se registre él mismo.

---

## Paso 2 — Asigná el rol admin en MySQL

Tenés tres formas de hacerlo:

### Opción A — Desde la terminal

Abrí una terminal y ejecutá el siguiente comando (reemplazá el correo):

```bash
mysql -u root -e "UPDATE pp3.users SET role = 'admin' WHERE email = 'correo@ejemplo.com';"
```

Si tu instalación de MySQL tiene contraseña, usá:

```bash
mysql -u root -p -e "UPDATE pp3.users SET role = 'admin' WHERE email = 'correo@ejemplo.com';"
```

### Opción B — Desde MySQL Workbench o TablePlus

Conectate al servidor local y ejecutá en el query editor:

```sql
USE pp3;
UPDATE users SET role = 'admin' WHERE email = 'correo@ejemplo.com';
```

### Opción C — Editando la tabla directamente

Abrí phpMyAdmin o cualquier cliente visual, entrá a la base de datos `pp3`,
abrí la tabla `users`, buscá al usuario y cambiá el campo `role` de `user` a `admin`.

---

## Paso 3 — Verificá y probá

Para confirmar que el cambio se aplicó correctamente:

```sql
SELECT id, email, role FROM pp3.users;
```

Deberías ver al usuario con `role = admin`.

Luego **cerrá sesión** en el portal (o entrá por primera vez) con ese usuario.
El sistema lo redirigirá automáticamente al panel de administración (`/admin`).

---

## Datos de conexión (del archivo .env)

| Parámetro | Valor         |
|-----------|---------------|
| Host      | localhost     |
| Usuario   | root          |
| Contraseña| (vacía)       |
| Base de datos | pp3       |

---

## Desde el panel admin podés promover otros usuarios

Una vez que tenés un admin activo, podés hacer admin a otros usuarios
directamente desde el portal sin tocar MySQL:

1. Iniciá sesión con el usuario admin
2. Hacé clic en el ícono de administración (escudo) en la barra superior
3. Ir a **Usuarios** (botón en el panel admin)
4. Hacé clic en **"Hacer admin"** en la fila del usuario que querés promover
