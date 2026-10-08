/**
 * Catálogo de permisos. El código es estable: la UI y las validaciones
 * dependen de él, no del nombre visible.
 *
 * Alcances (role_permission_scopes.scope_type) previstos:
 * group (activo), department, client, project.
 * Los permisos temporales viven en valid_from / valid_until.
 * La herencia de roles usa roles.parent_role_id.
 */

const MODULES = [
  { key: 'tickets', label: 'Tickets' },
  { key: 'assignments', label: 'Asignaciones' },
  { key: 'admin', label: 'Administración' },
  { key: 'kb', label: 'Base de conocimiento' },
  { key: 'reports', label: 'Reportes' },
  { key: 'views', label: 'Vistas' }
];

const PERMISSIONS = [
  { code: 'tickets.view', module: 'tickets', name: 'Ver tickets', description: 'Ver la cola y el detalle de tickets fuera de los propios', sort: 10 },
  { code: 'tickets.create', module: 'tickets', name: 'Crear tickets', description: 'Abrir una solicitud nueva', sort: 20 },
  { code: 'tickets.edit', module: 'tickets', name: 'Editar tickets', description: 'Modificar datos y el estado operativo del ticket', sort: 30 },
  { code: 'tickets.delete', module: 'tickets', name: 'Eliminar tickets', description: 'Borrar tickets', sort: 40 },
  { code: 'tickets.resolve', module: 'tickets', name: 'Resolver tickets', description: 'Registrar la resolución y pasar el ticket a resuelto', sort: 50 },
  { code: 'tickets.reopen', module: 'tickets', name: 'Reabrir tickets', description: 'Volver a abrir un ticket resuelto', sort: 60 },
  { code: 'tickets.close', module: 'tickets', name: 'Cerrar tickets', description: 'Cerrar tickets de forma definitiva', sort: 70 },
  { code: 'tickets.comment', module: 'tickets', name: 'Comentar tickets', description: 'Agregar comentarios', sort: 80 },
  { code: 'tickets.attach', module: 'tickets', name: 'Adjuntar archivos', description: 'Subir archivos al ticket', sort: 90 },

  { code: 'assignments.transfer', module: 'assignments', name: 'Derivar tickets', description: 'Cambiar el grupo del ticket. El alcance indica a qué grupos.', supportsScope: true, sort: 10 },
  { code: 'assignments.self', module: 'assignments', name: 'Autoasignarse tickets', description: 'Tomar un ticket para sí mismo', sort: 20 },
  { code: 'assignments.others', module: 'assignments', name: 'Asignar tickets a otros', description: 'Asignar o quitar el técnico de un ticket', sort: 30 },

  { code: 'admin.access', module: 'admin', name: 'Acceder al panel', description: 'Entrar al panel de administración', sort: 10 },
  { code: 'admin.users', module: 'admin', name: 'Gestionar usuarios', description: 'Ver y actualizar usuarios', sort: 20 },
  { code: 'admin.groups', module: 'admin', name: 'Gestionar grupos', description: 'Administrar grupos de resolución', sort: 30 },
  { code: 'admin.categories', module: 'admin', name: 'Gestionar categorías', description: 'Administrar categorías de tickets', sort: 40 },
  { code: 'admin.subcategories', module: 'admin', name: 'Gestionar subcategorías', description: 'Administrar subcategorías de tickets', sort: 50 },
  { code: 'admin.roles', module: 'admin', name: 'Gestionar roles', description: 'Crear y asignar roles y permisos', sort: 60 },
  { code: 'admin.settings', module: 'admin', name: 'Gestionar configuración', description: 'Cambiar la configuración general, incluido el SLA', sort: 70 },

  { code: 'kb.create', module: 'kb', name: 'Crear soluciones', description: 'Crear artículos de la base de conocimiento', sort: 10 },
  { code: 'kb.edit', module: 'kb', name: 'Editar soluciones', description: 'Editar artículos', sort: 20 },
  { code: 'kb.delete', module: 'kb', name: 'Eliminar soluciones', description: 'Eliminar artículos', sort: 30 },
  { code: 'kb.publish', module: 'kb', name: 'Publicar soluciones', description: 'Publicar artículos', sort: 40 },
  { code: 'kb.approve', module: 'kb', name: 'Aprobar soluciones', description: 'Aprobar artículos antes de publicarlos', sort: 50 },

  { code: 'reports.view', module: 'reports', name: 'Ver reportes', description: 'Consultar reportes', sort: 10 },
  { code: 'reports.export', module: 'reports', name: 'Exportar reportes', description: 'Exportar reportes', sort: 20 },

  { code: 'views.create', module: 'views', name: 'Crear vistas', description: 'Crear vistas guardadas de tickets', sort: 10 },
  { code: 'views.edit', module: 'views', name: 'Editar vistas', description: 'Modificar vistas propias', sort: 20 },
  { code: 'views.share', module: 'views', name: 'Compartir vistas', description: 'Compartir una vista con un grupo', sort: 30 }
];

const ALL_CODES = PERMISSIONS.map((item) => item.code);

const SOLICITANTE_CODES = [
  'tickets.create',
  'tickets.comment',
  'tickets.attach',
  'views.create',
  'views.edit'
];

const OPERADOR_CODES = [
  'tickets.view',
  'tickets.edit',
  'tickets.resolve',
  'tickets.reopen',
  'tickets.comment',
  'tickets.attach',
  'assignments.transfer',
  'assignments.self',
  'assignments.others',
  'views.create',
  'views.edit',
  'views.share'
];

const SUPERVISOR_CODES = [
  ...OPERADOR_CODES,
  'reports.view',
  'reports.export'
];

const SYSTEM_ROLES = [
  {
    code: 'administrador',
    name: 'Administrador',
    description: 'Acceso total al sistema. Los permisos de este rol se mantienen alineados al catálogo.',
    codes: ALL_CODES
  },
  {
    code: 'supervisor',
    name: 'Supervisor',
    description: 'Opera tickets y puede derivarlos a cualquier grupo.',
    codes: SUPERVISOR_CODES
  },
  {
    code: 'operador',
    name: 'Operador',
    description: 'Resuelve, comenta y deriva tickets. El alcance de derivación se puede restringir por grupo.',
    codes: OPERADOR_CODES
  },
  {
    code: 'solicitante',
    name: 'Solicitante',
    description: 'Crea solicitudes, comenta y adjunta archivos en sus propios tickets.',
    codes: SOLICITANTE_CODES
  }
];

const ACCOUNT_ROLE_MAP = {
  admin: 'administrador',
  technician: 'operador',
  user: 'solicitante'
};

const legacyCodesForAccount = (accountRole) => {
  if (accountRole === 'admin') return ALL_CODES;
  if (accountRole === 'technician') return OPERADOR_CODES;
  return SOLICITANTE_CODES;
};

const permissionByCode = (code) => PERMISSIONS.find((item) => item.code === code) || null;

module.exports = {
  MODULES,
  PERMISSIONS,
  ALL_CODES,
  SYSTEM_ROLES,
  ACCOUNT_ROLE_MAP,
  legacyCodesForAccount,
  permissionByCode
};
