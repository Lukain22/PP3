const {
  query,
  getRequestAccess,
  toPublicAccess,
  groupedCatalog,
  loadCatalog,
  readTransferScope,
  replaceTransferScope,
  replaceRolePermissions,
  inheritedPermissionCodes,
  loadGrantsForRoles,
  resolveAccess,
  assertNoCycle,
  knownCodes
} = require('../rbac/service');

const slugify = (name) => {
  const base = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base || 'rol';
};

const uniqueCode = async (name) => {
  const base = slugify(name);
  let code = base;
  let n = 2;
  while (true) {
    const rows = await query('SELECT id FROM roles WHERE code = ?', [code]);
    if (!rows.length) return code;
    code = `${base}-${n++}`.slice(0, 64);
  }
};

const actorCanGrant = async (req, codes) => {
  const access = await getRequestAccess(req);
  if (access.isSuperuser) return true;
  return codes.every((code) => access.has(code));
};

const effectiveCodes = async (parentId, directCodes) => {
  const codes = new Set(knownCodes(directCodes));
  if (parentId) {
    const inherited = await loadGrantsForRoles([Number(parentId)]);
    inherited.codes.forEach((code) => codes.add(code));
  }
  return [...codes];
};

const mapRoleRow = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  is_active: Boolean(Number(row.is_active)),
  is_system: Boolean(Number(row.is_system)),
  parent_role_id: row.parent_role_id || null,
  created_by: row.created_by || null,
  created_by_email: row.created_by_email || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  user_count: Number(row.user_count || 0)
});

const loadRole = async (id) => {
  const rows = await query(
    `SELECT r.*, u.email AS created_by_email,
            (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
     FROM roles r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.listPermissions = async (req, res) => {
  try {
    const catalog = await loadCatalog();
    res.json({ modules: groupedCatalog(catalog) });
  } catch (err) {
    console.error('Error en listPermissions:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const rows = await query(
      `SELECT r.*, u.email AS created_by_email,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS user_count
       FROM roles r
       LEFT JOIN users u ON u.id = r.created_by
       ORDER BY r.is_system DESC, r.name ASC`
    );
    res.json(rows.map(mapRoleRow));
  } catch (err) {
    console.error('Error en listRoles:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};

exports.getFormOptions = async (req, res) => {
  try {
    const [groups, roles, catalog] = await Promise.all([
      query('SELECT id, name FROM `groups` ORDER BY name ASC'),
      query('SELECT id, name, code, is_active FROM roles ORDER BY name ASC'),
      loadCatalog()
    ]);
    res.json({
      groups,
      roles: roles.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        is_active: Boolean(Number(row.is_active))
      })),
      modules: groupedCatalog(catalog)
    });
  } catch (err) {
    console.error('Error en getFormOptions:', err.code || err.message);
    res.status(500).json({ message: 'Error al cargar el formulario de roles' });
  }
};

exports.getRole = async (req, res) => {
  try {
    const role = await loadRole(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    const permRows = await query(
      `SELECT p.code
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [role.id]
    );
    const inherited = await inheritedPermissionCodes(role.id);
    const transfer = await readTransferScope(role.id);

    res.json({
      ...mapRoleRow(role),
      permission_codes: permRows.map((row) => row.code),
      inherited_permission_codes: inherited.codes,
      inherited_transfer_all: inherited.transferAll,
      transfer_scope: transfer
    });
  } catch (err) {
    console.error('Error en getRole:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener el rol' });
  }
};

const parsePayload = (body) => {
  const name = String(body.name || '').trim();
  const description = body.description == null ? null : String(body.description).trim().slice(0, 500);
  const parentId = body.parent_role_id ? Number(body.parent_role_id) : null;
  const isActive = body.is_active === undefined ? true : Boolean(body.is_active);
  const permissionCodes = knownCodes(body.permission_codes);
  if (permissionCodes.some((code) => code.startsWith('admin.') && code !== 'admin.access') && !permissionCodes.includes('admin.access')) {
    permissionCodes.push('admin.access');
  }
  const transferScope = body.transfer_scope || { mode: 'all', group_ids: [] };
  const mode = ['all', 'allow', 'deny'].includes(transferScope.mode) ? transferScope.mode : 'all';
  return {
    name,
    description: description || null,
    parentId: parentId || null,
    isActive,
    permissionCodes,
    transferScope: {
      mode,
      group_ids: Array.isArray(transferScope.group_ids) ? transferScope.group_ids.map(Number).filter((id) => id > 0) : []
    }
  };
};

const validatePayload = async (payload, roleId) => {
  if (!payload.name || payload.name.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  if (payload.name.length > 80) return 'El nombre es demasiado largo';

  const dup = await query('SELECT id FROM roles WHERE name = ? AND id <> ?', [payload.name, roleId || 0]);
  if (dup.length) return 'Ya existe un rol con ese nombre';

  if (payload.parentId) {
    const parent = await query('SELECT id FROM roles WHERE id = ?', [payload.parentId]);
    if (!parent.length) return 'El rol padre no existe';
    await assertNoCycle(roleId, payload.parentId);
  }

  if (payload.permissionCodes.includes('assignments.transfer') && payload.transferScope.mode !== 'all' && payload.transferScope.group_ids.length === 0) {
    return 'Elegí al menos un grupo para el alcance de derivación';
  }

  if (payload.transferScope.group_ids.length) {
    const groups = await query('SELECT id FROM `groups` WHERE id IN (?)', [payload.transferScope.group_ids]);
    if (groups.length !== payload.transferScope.group_ids.length) return 'Hay grupos inválidos en el alcance';
  }

  return null;
};

const persistGrants = async (roleId, payload) => {
  await replaceRolePermissions(roleId, payload.permissionCodes);
  if (payload.permissionCodes.includes('assignments.transfer')) {
    await replaceTransferScope(roleId, payload.transferScope);
    return;
  }
  const perm = await query('SELECT id FROM permissions WHERE code = ?', ['assignments.transfer']);
  if (!perm.length) return;
  await query('DELETE FROM role_permission_scopes WHERE role_id = ? AND permission_id = ?', [roleId, perm[0].id]);
};

exports.createRole = async (req, res) => {
  try {
    const payload = parsePayload(req.body);
    const error = await validatePayload(payload, null);
    if (error) return res.status(400).json({ message: error });

    const grantCodes = await effectiveCodes(payload.parentId, payload.permissionCodes);
    if (!(await actorCanGrant(req, grantCodes))) {
      return res.status(403).json({ message: 'No podés otorgar permisos que no tenés' });
    }

    const code = await uniqueCode(payload.name);
    const result = await query(
      `INSERT INTO roles (code, name, description, is_active, is_system, parent_role_id, created_by)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [code, payload.name, payload.description, payload.isActive ? 1 : 0, payload.parentId, req.user.id]
    );
    await persistGrants(result.insertId, payload);
    const created = await loadRole(result.insertId);
    res.status(201).json(mapRoleRow(created));
  } catch (err) {
    console.error('Error en createRole:', err.code || err.message);
    res.status(400).json({ message: err.message || 'Error al crear el rol' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const current = await loadRole(req.params.id);
    if (!current) return res.status(404).json({ message: 'Rol no encontrado' });

    const access = await getRequestAccess(req);
    if (current.code === 'administrador' && !access.isSuperuser) {
      return res.status(403).json({ message: 'Solo un administrador de cuenta puede modificar este rol' });
    }

    const payload = parsePayload({
      ...req.body,
      name: req.body.name === undefined ? current.name : req.body.name,
      description: req.body.description === undefined ? current.description : req.body.description,
      parent_role_id: req.body.parent_role_id === undefined ? current.parent_role_id : req.body.parent_role_id,
      is_active: req.body.is_active === undefined ? Boolean(Number(current.is_active)) : req.body.is_active
    });

    if (current.code === 'administrador') {
      payload.isActive = true;
      payload.parentId = null;
      payload.permissionCodes = knownCodes(require('../rbac/permissions').ALL_CODES);
      payload.transferScope = { mode: 'all', group_ids: [] };
    }

    if (current.is_system && req.body.name && req.body.name !== current.name) {
      payload.name = current.name;
    }

    const onlyStatus = req.body.is_active !== undefined
      && req.body.name === undefined
      && req.body.permission_codes === undefined
      && req.body.description === undefined
      && req.body.parent_role_id === undefined
      && req.body.transfer_scope === undefined;

    if (onlyStatus) {
      if (current.code === 'administrador' && !payload.isActive) {
        return res.status(400).json({ message: 'El rol Administrador no se puede desactivar' });
      }
      await query('UPDATE roles SET is_active = ? WHERE id = ?', [payload.isActive ? 1 : 0, current.id]);
      const updated = await loadRole(current.id);
      return res.json(mapRoleRow(updated));
    }

    const error = await validatePayload(payload, current.id);
    if (error) return res.status(400).json({ message: error });

    if (current.code !== 'administrador') {
      const grantCodes = await effectiveCodes(payload.parentId, payload.permissionCodes);
      if (!(await actorCanGrant(req, grantCodes))) {
        return res.status(403).json({ message: 'No podés otorgar permisos que no tenés' });
      }
    }

    await query(
      `UPDATE roles
       SET name = ?, description = ?, is_active = ?, parent_role_id = ?
       WHERE id = ?`,
      [payload.name, payload.description, payload.isActive ? 1 : 0, payload.parentId, current.id]
    );
    if (req.body.permission_codes !== undefined || req.body.transfer_scope !== undefined || current.code === 'administrador') {
      await persistGrants(current.id, payload);
    }
    const updated = await loadRole(current.id);
    res.json(mapRoleRow(updated));
  } catch (err) {
    console.error('Error en updateRole:', err.code || err.message);
    res.status(400).json({ message: err.message || 'Error al actualizar el rol' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await loadRole(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    if (Number(role.is_system) === 1) {
      return res.status(400).json({ message: 'Los roles del sistema no se pueden eliminar' });
    }
    if (Number(role.user_count) > 0) {
      return res.status(400).json({ message: 'Quitá este rol de los usuarios antes de eliminarlo' });
    }
    await query('UPDATE roles SET parent_role_id = NULL WHERE parent_role_id = ?', [role.id]);
    await query('DELETE FROM roles WHERE id = ?', [role.id]);
    res.json({ message: 'Rol eliminado' });
  } catch (err) {
    console.error('Error en deleteRole:', err.code || err.message);
    res.status(500).json({ message: 'Error al eliminar el rol' });
  }
};

exports.duplicateRole = async (req, res) => {
  try {
    const role = await loadRole(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    const permRows = await query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?`,
      [role.id]
    );
    const codes = permRows.map((row) => row.code);
    if (!(await actorCanGrant(req, codes))) {
      return res.status(403).json({ message: 'No podés duplicar un rol con permisos que no tenés' });
    }

    const nameBase = `Copia de ${role.name}`.slice(0, 70);
    let name = nameBase;
    let suffix = 2;
    while ((await query('SELECT id FROM roles WHERE name = ?', [name])).length) {
      name = `${nameBase} ${suffix++}`.slice(0, 80);
    }
    const code = await uniqueCode(name);
    const transfer = await readTransferScope(role.id);
    const result = await query(
      `INSERT INTO roles (code, name, description, is_active, is_system, parent_role_id, created_by)
       VALUES (?, ?, ?, 1, 0, ?, ?)`,
      [code, name, role.description, role.parent_role_id, req.user.id]
    );
    await persistGrants(result.insertId, {
      permissionCodes: codes,
      transferScope: transfer
    });
    const created = await loadRole(result.insertId);
    res.status(201).json(mapRoleRow(created));
  } catch (err) {
    console.error('Error en duplicateRole:', err.code || err.message);
    res.status(500).json({ message: 'Error al duplicar el rol' });
  }
};

exports.listAssignableRoles = async (req, res) => {
  try {
    const access = await getRequestAccess(req);
    const roles = await query('SELECT id, name, code, is_active FROM roles ORDER BY name ASC');
    const visible = [];
    for (const role of roles) {
      if (!access.isSuperuser) {
        const grants = await loadGrantsForRoles([role.id]);
        const codes = [...grants.codes];
        if (codes.some((code) => !access.has(code))) continue;
      }
      visible.push({
        id: role.id,
        name: role.name,
        code: role.code,
        is_active: Boolean(Number(role.is_active))
      });
    }
    res.json(visible);
  } catch (err) {
    console.error('Error en listAssignableRoles:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};

exports.getUserAccess = async (req, res) => {
  try {
    const users = await query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!users.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    const assignments = await query(
      `SELECT r.id, r.name, r.code, r.is_active, ur.valid_from, ur.valid_until, ur.assigned_at
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY r.name`,
      [req.params.id]
    );
    const access = await resolveAccess(users[0].id, users[0].role);
    res.json({
      ...toPublicAccess(access),
      assignments: assignments.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        is_active: Boolean(Number(row.is_active)),
        valid_from: row.valid_from,
        valid_until: row.valid_until,
        assigned_at: row.assigned_at
      }))
    });
  } catch (err) {
    console.error('Error en getUserAccess:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener roles del usuario' });
  }
};

exports.setUserRoles = async (req, res) => {
  try {
    const users = await query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!users.length) return res.status(404).json({ message: 'Usuario no encontrado' });

    const raw = Array.isArray(req.body.assignments)
      ? req.body.assignments
      : (req.body.role_ids || []).map((id) => ({ role_id: id }));

    const normalized = raw
      .map((item) => ({
        role_id: Number(item.role_id ?? item),
        valid_from: item.valid_from || null,
        valid_until: item.valid_until || null
      }))
      .filter((item) => item.role_id > 0);

    const unique = [];
    const seen = new Set();
    normalized.forEach((item) => {
      if (seen.has(item.role_id)) return;
      seen.add(item.role_id);
      unique.push(item);
    });

    if (unique.length) {
      const existing = await query('SELECT id FROM roles WHERE id IN (?)', [unique.map((item) => item.role_id)]);
      if (existing.length !== unique.length) {
        return res.status(400).json({ message: 'Hay roles inválidos' });
      }
    }

    const { codes } = await loadGrantsForRoles(unique.map((item) => item.role_id));
    if (!(await actorCanGrant(req, [...codes]))) {
      return res.status(403).json({ message: 'No podés asignar un rol con permisos que no tenés' });
    }

    await query('DELETE FROM user_roles WHERE user_id = ?', [req.params.id]);
    if (unique.length) {
      await query(
        'INSERT INTO user_roles (user_id, role_id, assigned_by, valid_from, valid_until) VALUES ?',
        [unique.map((item) => [Number(req.params.id), item.role_id, req.user.id, item.valid_from, item.valid_until])]
      );
    }

    return exports.getUserAccess(req, res);
  } catch (err) {
    console.error('Error en setUserRoles:', err.code || err.message);
    res.status(500).json({ message: 'Error al asignar roles' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const access = await getRequestAccess(req);
    res.json({
      id: req.user.id,
      email: req.user.email,
      ...toPublicAccess(access)
    });
  } catch (err) {
    console.error('Error en getMe:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener la sesión' });
  }
};
