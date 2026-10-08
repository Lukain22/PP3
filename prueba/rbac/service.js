const db = require('../db/db');
const {
  MODULES,
  PERMISSIONS,
  ALL_CODES,
  SYSTEM_ROLES,
  ACCOUNT_ROLE_MAP,
  legacyCodesForAccount,
  permissionByCode
} = require('./permissions');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const MAX_DEPTH = 8;

const emptyScope = () => ({ all: false, allow: new Set(), deny: new Set() });

const serializeScope = (scope) => ({
  all: Boolean(scope?.all),
  allow: [...(scope?.allow || [])].map(Number),
  deny: [...(scope?.deny || [])].map(Number)
});

const hasScopeGrant = (scope) =>
  Boolean(scope && (scope.all || scope.allow.size > 0 || scope.deny.size > 0));

const buildAccess = ({ isSuperuser, accountRole, roles, permissionCodes, catalog, scopes }) => {
  const codes = new Set(permissionCodes);
  const permissions = catalog
    .filter((item) => codes.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      module: item.module,
      module_label: MODULES.find((mod) => mod.key === item.module)?.label || item.module,
      description: item.description || null
    }));

  const publicScopes = {};
  Object.entries(scopes || {}).forEach(([code, scope]) => {
    publicScopes[code] = serializeScope(scope);
  });

  return {
    isSuperuser: Boolean(isSuperuser),
    accountRole: accountRole || 'user',
    roles,
    permissionCodes: codes,
    permissions,
    scopes,
    publicScopes,
    has(code) {
      if (isSuperuser) return true;
      return codes.has(code);
    },
    canTransferTo(groupId) {
      if (isSuperuser) return true;
      if (!codes.has('assignments.transfer')) return false;
      const scope = scopes['assignments.transfer'];
      if (!scope || (!scope.all && scope.allow.size === 0 && scope.deny.size === 0)) {
        return true;
      }
      const id = Number(groupId);
      if (scope.deny.has(id)) return false;
      if (scope.all) return true;
      return scope.allow.has(id);
    }
  };
};

const toPublicAccess = (access) => ({
  is_superuser: access.isSuperuser,
  account_role: access.accountRole,
  roles: access.roles,
  permissions: access.permissions,
  scopes: access.publicScopes
});

const mergeScopeRow = (bucket, row) => {
  const mode = row.scope_mode;
  const refId = Number(row.scope_ref_id) || 0;
  if (mode === 'all') bucket.all = true;
  else if (mode === 'deny' && refId) bucket.deny.add(refId);
  else if (mode === 'allow' && refId) bucket.allow.add(refId);
};

const loadCatalog = async () => {
  const rows = await query(
    'SELECT code, module, name, description, supports_scope, sort_order FROM permissions ORDER BY module, sort_order, name'
  );
  if (!rows.length) return PERMISSIONS.map((item) => ({ ...item, supports_scope: item.supportsScope ? 1 : 0 }));
  return rows;
};

const expandRoleIds = async (roleIds) => {
  const seen = new Set();
  const ordered = [];
  const queue = roleIds.map(Number).filter(Boolean);

  while (queue.length && ordered.length < 50) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
    if (ordered.length >= MAX_DEPTH * Math.max(roleIds.length, 1)) break;

    const rows = await query('SELECT parent_role_id, is_active FROM roles WHERE id = ?', [id]);
    const parentId = rows[0]?.parent_role_id ? Number(rows[0].parent_role_id) : null;
    const parentActive = parentId
      ? (await query('SELECT is_active FROM roles WHERE id = ?', [parentId]))[0]
      : null;
    if (parentId && parentActive && Number(parentActive.is_active) === 1 && !seen.has(parentId)) {
      queue.push(parentId);
    }
  }

  return ordered;
};

const loadGrantsForRoles = async (roleIds) => {
  if (!roleIds.length) {
    return { codes: new Set(), scopes: {} };
  }

  const expanded = await expandRoleIds(roleIds);
  const permRows = await query(
    `SELECT p.code
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     JOIN roles r ON r.id = rp.role_id
     WHERE rp.role_id IN (?)
       AND r.is_active = 1
       AND (rp.valid_from IS NULL OR rp.valid_from <= NOW())
       AND (rp.valid_until IS NULL OR rp.valid_until >= NOW())`,
    [expanded]
  );

  const scopeRows = await query(
    `SELECT p.code, s.scope_type, s.scope_mode, s.scope_ref_id
     FROM role_permission_scopes s
     JOIN permissions p ON p.id = s.permission_id
     WHERE s.role_id IN (?)`,
    [expanded]
  );

  const codes = new Set(permRows.map((row) => row.code));
  const scopes = {};
  scopeRows.forEach((row) => {
    if (row.scope_type !== 'group') return;
    if (!scopes[row.code]) scopes[row.code] = emptyScope();
    mergeScopeRow(scopes[row.code], row);
  });

  return { codes, scopes };
};

const resolveAccess = async (userId, accountRole) => {
  const roleName = accountRole || 'user';
  const catalog = await loadCatalog();

  if (roleName === 'admin') {
    const roleRows = await query(
      `SELECT r.id, r.name, r.code, r.is_active
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?
         AND (ur.valid_from IS NULL OR ur.valid_from <= NOW())
         AND (ur.valid_until IS NULL OR ur.valid_until >= NOW())
       ORDER BY r.name`,
      [userId]
    );
    const fullScopes = { 'assignments.transfer': { all: true, allow: new Set(), deny: new Set() } };
    return buildAccess({
      isSuperuser: true,
      accountRole: roleName,
      roles: roleRows,
      permissionCodes: ALL_CODES,
      catalog,
      scopes: fullScopes
    });
  }

  const assigned = await query(
    `SELECT r.id, r.name, r.code, r.is_active
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?
       AND r.is_active = 1
       AND (ur.valid_from IS NULL OR ur.valid_from <= NOW())
       AND (ur.valid_until IS NULL OR ur.valid_until >= NOW())
     ORDER BY r.name`,
    [userId]
  );

  const anyAssignment = await query('SELECT role_id FROM user_roles WHERE user_id = ? LIMIT 1', [userId]);

  if (!anyAssignment.length) {
    return buildAccess({
      isSuperuser: false,
      accountRole: roleName,
      roles: [],
      permissionCodes: legacyCodesForAccount(roleName),
      catalog,
      scopes: {
        'assignments.transfer': { all: true, allow: new Set(), deny: new Set() }
      }
    });
  }

  const { codes, scopes } = await loadGrantsForRoles(assigned.map((row) => row.id));
  return buildAccess({
    isSuperuser: false,
    accountRole: roleName,
    roles: assigned,
    permissionCodes: codes,
    catalog,
    scopes
  });
};

const getRequestAccess = async (req) => {
  if (req.access) return req.access;
  const rows = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
  if (rows[0]?.role) req.user.role = rows[0].role;
  req.access = await resolveAccess(req.user.id, req.user.role || 'user');
  return req.access;
};

const groupedCatalog = (rows) =>
  MODULES.map((mod) => ({
    key: mod.key,
    label: mod.label,
    permissions: rows
      .filter((row) => row.module === mod.key)
      .map((row) => ({
        code: row.code,
        name: row.name,
        description: row.description || null,
        supports_scope: Boolean(Number(row.supports_scope ?? row.supportsScope))
      }))
  })).filter((mod) => mod.permissions.length > 0);

const readTransferScope = async (roleId) => {
  const rows = await query(
    `SELECT s.scope_mode, s.scope_ref_id
     FROM role_permission_scopes s
     JOIN permissions p ON p.id = s.permission_id
     WHERE s.role_id = ? AND p.code = 'assignments.transfer' AND s.scope_type = 'group'`,
    [roleId]
  );
  if (!rows.length) return { mode: 'all', group_ids: [] };
  if (rows.some((row) => row.scope_mode === 'all')) return { mode: 'all', group_ids: [] };
  if (rows.some((row) => row.scope_mode === 'deny')) {
    return {
      mode: 'deny',
      group_ids: rows.filter((row) => row.scope_mode === 'deny' && Number(row.scope_ref_id) > 0).map((row) => Number(row.scope_ref_id))
    };
  }
  return {
    mode: 'allow',
    group_ids: rows.filter((row) => row.scope_mode === 'allow' && Number(row.scope_ref_id) > 0).map((row) => Number(row.scope_ref_id))
  };
};

const replaceTransferScope = async (roleId, scope) => {
  const perm = await query('SELECT id FROM permissions WHERE code = ?', ['assignments.transfer']);
  if (!perm.length) return;
  const permissionId = perm[0].id;
  await query('DELETE FROM role_permission_scopes WHERE role_id = ? AND permission_id = ? AND scope_type = ?', [
    roleId,
    permissionId,
    'group'
  ]);

  const mode = scope?.mode || 'all';
  if (mode === 'all') {
    await query(
      `INSERT INTO role_permission_scopes (role_id, permission_id, scope_type, scope_mode, scope_ref_id)
       VALUES (?, ?, 'group', 'all', 0)`,
      [roleId, permissionId]
    );
    return;
  }

  const ids = [...new Set((scope.group_ids || []).map(Number).filter((id) => id > 0))];
  if (!ids.length) {
    await query(
      `INSERT INTO role_permission_scopes (role_id, permission_id, scope_type, scope_mode, scope_ref_id)
       VALUES (?, ?, 'group', 'all', 0)`,
      [roleId, permissionId]
    );
    return;
  }

  const values = ids.map((id) => [roleId, permissionId, 'group', mode, id]);
  await query(
    `INSERT INTO role_permission_scopes (role_id, permission_id, scope_type, scope_mode, scope_ref_id)
     VALUES ?`,
    [values]
  );
};

const replaceRolePermissions = async (roleId, codes) => {
  const unique = [...new Set(codes)];
  await query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  if (!unique.length) return;
  const rows = await query('SELECT id, code FROM permissions WHERE code IN (?)', [unique]);
  if (!rows.length) return;
  await query(
    'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
    [rows.map((row) => [roleId, row.id])]
  );
};

const inheritedPermissionCodes = async (roleId) => {
  const rows = await query('SELECT parent_role_id FROM roles WHERE id = ?', [roleId]);
  const parentId = rows[0]?.parent_role_id ? Number(rows[0].parent_role_id) : null;
  if (!parentId) return { codes: [], transferAll: false };
  const { codes, scopes } = await loadGrantsForRoles([parentId]);
  const transfer = scopes['assignments.transfer'];
  return {
    codes: [...codes],
    transferAll: Boolean(transfer?.all)
  };
};

const ensureSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      module VARCHAR(64) NOT NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(255) NULL,
      supports_scope TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(80) NOT NULL,
      description VARCHAR(500) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      is_system TINYINT(1) NOT NULL DEFAULT 0,
      parent_role_id INT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_roles_name (name),
      CONSTRAINT fk_roles_parent FOREIGN KEY (parent_role_id) REFERENCES roles(id) ON DELETE SET NULL,
      CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      valid_from TIMESTAMP NULL DEFAULT NULL,
      valid_until TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (role_id, permission_id),
      CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INT NOT NULL,
      role_id INT NOT NULL,
      assigned_by INT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      valid_from TIMESTAMP NULL DEFAULT NULL,
      valid_until TIMESTAMP NULL DEFAULT NULL,
      PRIMARY KEY (user_id, role_id),
      CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS role_permission_scopes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      scope_type VARCHAR(32) NOT NULL DEFAULT 'group',
      scope_mode VARCHAR(16) NOT NULL DEFAULT 'allow',
      scope_ref_id INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_role_scope (role_id, permission_id, scope_type, scope_mode, scope_ref_id),
      CONSTRAINT fk_rps_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      CONSTRAINT fk_rps_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);
};

const seedCatalog = async () => {
  for (const item of PERMISSIONS) {
    await query(
      `INSERT INTO permissions (code, module, name, description, supports_scope, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         module = VALUES(module),
         name = VALUES(name),
         description = VALUES(description),
         supports_scope = VALUES(supports_scope),
         sort_order = VALUES(sort_order)`,
      [item.code, item.module, item.name, item.description, item.supportsScope ? 1 : 0, item.sort]
    );
  }
};

const seedSystemRoles = async () => {
  for (const role of SYSTEM_ROLES) {
    await query(
      `INSERT INTO roles (code, name, description, is_active, is_system)
       VALUES (?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE
         description = IF(code = 'administrador', VALUES(description), description)`,
      [role.code, role.name, role.description]
    );

    const rows = await query('SELECT id FROM roles WHERE code = ?', [role.code]);
    const roleId = rows[0].id;
    const current = await query('SELECT permission_id FROM role_permissions WHERE role_id = ? LIMIT 1', [roleId]);
    const shouldFill = role.code === 'administrador' || current.length === 0;
    if (shouldFill) {
      await replaceRolePermissions(roleId, role.codes);
    }

    if (role.codes.includes('assignments.transfer')) {
      const transfer = await query(
        `SELECT s.id
         FROM role_permission_scopes s
         JOIN permissions p ON p.id = s.permission_id
         WHERE s.role_id = ? AND p.code = 'assignments.transfer'
         LIMIT 1`,
        [roleId]
      );
      if (!transfer.length) {
        await replaceTransferScope(roleId, { mode: 'all', group_ids: [] });
      }
    }
  }
};

const seedUserRoles = async () => {
  const roles = await query('SELECT id, code FROM roles WHERE is_system = 1');
  const byCode = Object.fromEntries(roles.map((row) => [row.code, row.id]));

  const users = await query(
    `SELECT u.id, u.role
     FROM users u
     WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)`
  );

  for (const user of users) {
    const code = ACCOUNT_ROLE_MAP[user.role] || 'solicitante';
    const roleId = byCode[code];
    if (!roleId) continue;
    await query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [user.id, roleId]);
  }
};

const assignDefaultRole = async (userId, accountRole) => {
  const code = ACCOUNT_ROLE_MAP[accountRole] || 'solicitante';
  const rows = await query('SELECT id FROM roles WHERE code = ?', [code]);
  if (!rows.length) return;
  await query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, rows[0].id]);
};

const syncSystemRoleForAccount = async (userId, accountRole) => {
  const code = ACCOUNT_ROLE_MAP[accountRole] || 'solicitante';
  await query(
    `DELETE ur FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_system = 1 AND r.code <> ?`,
    [userId, code]
  );
  await assignDefaultRole(userId, accountRole);
};

const initRbac = async () => {
  try {
    await ensureSchema();
    await seedCatalog();
    await seedSystemRoles();
    await seedUserRoles();
    console.log('RBAC listo');
  } catch (err) {
    console.error('Error inicializando RBAC:', err.code || err.message);
  }
};

const assertNoCycle = async (roleId, parentId) => {
  if (!parentId) return;
  if (roleId && Number(parentId) === Number(roleId)) {
    throw new Error('Un rol no puede heredarse a sí mismo');
  }
  let current = Number(parentId);
  const seen = new Set();
  while (current) {
    if (roleId && current === Number(roleId)) {
      throw new Error('Esa herencia formaría un ciclo');
    }
    if (seen.has(current)) throw new Error('Esa herencia formaría un ciclo');
    seen.add(current);
    if (seen.size > MAX_DEPTH) throw new Error('La jerarquía de roles supera el máximo permitido');
    const rows = await query('SELECT parent_role_id FROM roles WHERE id = ?', [current]);
    if (!rows.length) throw new Error('El rol padre no existe');
    current = rows[0].parent_role_id ? Number(rows[0].parent_role_id) : null;
  }
};

const knownCodes = (codes) => {
  const set = new Set(ALL_CODES);
  return (codes || []).filter((code) => set.has(code));
};

module.exports = {
  query,
  initRbac,
  resolveAccess,
  getRequestAccess,
  toPublicAccess,
  groupedCatalog,
  loadCatalog,
  readTransferScope,
  replaceTransferScope,
  replaceRolePermissions,
  inheritedPermissionCodes,
  loadGrantsForRoles,
  assignDefaultRole,
  syncSystemRoleForAccount,
  assertNoCycle,
  knownCodes,
  permissionByCode,
  hasScopeGrant,
  emptyScope
};
