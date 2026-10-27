const db = require('../db/db');
const { getUserGroupIds } = require('../utils/groups');
const { normalizeViewFilters } = require('../utils/ticketFilters');

const VALID_SCOPES = ['tickets', 'admin', 'technician'];
const VALID_VISIBILITY = ['personal', 'group', 'public'];

const normalizeScope = (scope) => {
  if (scope === 'admin' || scope === 'technician') return 'tickets';
  return scope;
};

const groupsForRow = (row, map) => {
  const listed = map?.get(row.id) || [];
  if (listed.length) return listed;
  if (row.share_group_id) {
    return [{ id: row.share_group_id, name: row.share_group_name || null }];
  }
  return [];
};

const serializeView = (row, shareGroups) => {
  const groups = shareGroups || groupsForRow(row);
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    scope: normalizeScope(row.scope),
    visibility: row.visibility,
    share_group_id: groups[0]?.id ?? row.share_group_id ?? null,
    share_group_name: groups[0]?.name ?? row.share_group_name ?? null,
    share_groups: groups,
    filters: typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters,
    sort_by: row.sort_by,
    sort_order: row.sort_order ?? 0,
    creator_email: row.creator_email || null,
    is_owner: Boolean(Number(row.is_owner)),
    hidden: Boolean(Number(row.hidden)),
    audience: row.audience || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

const loadShareGroups = (viewIds, callback) => {
  if (!viewIds.length) return callback(null, new Map());
  db.query(
    `SELECT vg.view_id, g.id, g.name
     FROM ticket_view_groups vg
     JOIN \`groups\` g ON g.id = vg.group_id
     WHERE vg.view_id IN (?)
     ORDER BY g.name ASC`,
    [viewIds],
    (err, rows) => {
      if (err) return callback(err);
      const map = new Map();
      rows.forEach((row) => {
        const list = map.get(row.view_id) || [];
        list.push({ id: row.id, name: row.name });
        map.set(row.view_id, list);
      });
      callback(null, map);
    }
  );
};

const replaceViewGroups = (viewId, groupIds, callback) => {
  db.query('DELETE FROM ticket_view_groups WHERE view_id = ?', [viewId], (err) => {
    if (err) return callback(err);
    if (!groupIds.length) return callback(null);
    const values = groupIds.map((groupId) => [viewId, groupId]);
    db.query('INSERT INTO ticket_view_groups (view_id, group_id) VALUES ?', [values], (insertErr) =>
      callback(insertErr || null)
    );
  });
};

const fetchSerializedView = (id, userId, callback) => {
  db.query(
    `SELECT v.*, u.email AS creator_email, g.name AS share_group_name,
            (v.user_id = ?) AS is_owner
     FROM ticket_views v
     JOIN users u ON u.id = v.user_id
     LEFT JOIN \`groups\` g ON g.id = v.share_group_id
     WHERE v.id = ?`,
    [userId, id],
    (err, rows) => {
      if (err) return callback(err);
      if (!rows.length) return callback(null, null);
      loadShareGroups([rows[0].id], (groupErr, map) => {
        if (groupErr) return callback(groupErr);
        callback(null, serializeView(rows[0], groupsForRow(rows[0], map)));
      });
    }
  );
};

const validateViewPayload = (body, user, callback) => {
  const { name, scope, visibility, share_group_id, filters, sort_by, sort_order } = body;
  const normalizedScope = normalizeScope(scope || 'tickets');

  if (!name || !String(name).trim()) {
    return callback(new Error('El nombre es requerido'));
  }

  if (!normalizedScope || !VALID_SCOPES.includes(normalizedScope)) {
    return callback(new Error('Scope inválido'));
  }

  const vis = visibility || 'personal';
  if (!VALID_VISIBILITY.includes(vis) || (vis === 'public' && user.role !== 'admin')) {
    return callback(new Error('Visibilidad inválida'));
  }

  const basePayload = {
    name: String(name).trim(),
    scope: normalizedScope,
    visibility: vis,
    share_group_id: null,
    share_group_ids: [],
    filters: normalizeViewFilters(filters),
    sort_by: sort_by || 'date-desc',
    sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0
  };

  if (vis !== 'group') {
    return callback(null, basePayload);
  }

  const rawIds =
    Array.isArray(body.share_group_ids) && body.share_group_ids.length
      ? body.share_group_ids
      : [share_group_id];
  const groupIds = [
    ...new Set(rawIds.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0))
  ];
  if (!groupIds.length) {
    return callback(new Error('Seleccioná un grupo para compartir la vista'));
  }

  const finish = () =>
    callback(null, {
      ...basePayload,
      share_group_id: groupIds[0],
      share_group_ids: groupIds
    });

  if (user.role === 'admin') {
    return db.query('SELECT id FROM `groups` WHERE id IN (?)', [groupIds], (err, rows) => {
      if (err) return callback(new Error('Error al verificar grupo'));
      if (rows.length !== groupIds.length) return callback(new Error('Grupo inválido'));
      finish();
    });
  }

  return getUserGroupIds(user.id, (groupErr, memberIds) => {
    if (groupErr) return callback(new Error('Error al verificar grupos'));
    if (groupIds.some((id) => !memberIds.includes(id))) {
      return callback(new Error('Solo podés compartir vistas con grupos a los que pertenecés'));
    }
    finish();
  });
};

exports.getViews = (req, res) => {
  const scope = normalizeScope(req.query.scope || 'tickets');
  const user = req.user;

  if (!VALID_SCOPES.includes(scope)) {
    return res.status(400).json({ message: 'Scope inválido' });
  }

  const { getRequestAccess, resolveTicketViewGrant } = require('../rbac/service');

  getRequestAccess(req)
    .then((access) => {
      const grant = user.role === 'admin' ? null : resolveTicketViewGrant(access);
      loadVisibleViews(req, res, scope, user, grant);
    })
    .catch(() => res.status(500).json({ message: 'Error al obtener vistas' }));
};

const loadVisibleViews = (req, res, scope, user, grant) => {
  getUserGroupIds(user.id, (groupErr, groupIds) => {
    if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });

    const params = [user.id, scope, user.id];
    const access = ['v.user_id = ?'];
    const audiences =
      user.role === 'user' ? ['user', 'both'] : user.role === 'technician' ? ['technician', 'both'] : null;
    const audienceSql = audiences
      ? `AND (v.audience IS NULL OR v.audience IN (${audiences.map(() => '?').join(', ')}))`
      : '';

    if (audiences) {
      access.push(`(v.visibility = 'public' ${audienceSql})`);
      params.push(...audiences);
    } else {
      access.push("(v.visibility = 'public')");
    }

    if (user.role === 'admin' || (grant && grant.mode === 'all')) {
      access.push("(v.visibility = 'public')");
      access.push(
        "(v.visibility = 'group' AND (v.share_group_id IS NOT NULL OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id)))"
      );
    } else if (grant && grant.mode === 'allow' && grant.ids.length > 0) {
      const placeholders = grant.ids.map(() => '?').join(', ');
      access.push("(v.visibility = 'public')");
      access.push(
        `(v.visibility = 'group' AND (v.share_group_id IN (${placeholders}) OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id AND vg.group_id IN (${placeholders}))))`
      );
      params.push(...grant.ids, ...grant.ids);
    } else if (grant && grant.mode === 'deny') {
      access.push("(v.visibility = 'public')");
      if (grant.ids.length > 0) {
        const placeholders = grant.ids.map(() => '?').join(', ');
        access.push(
          `(v.visibility = 'group' AND ((v.share_group_id IS NULL OR v.share_group_id NOT IN (${placeholders})) OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id AND vg.group_id NOT IN (${placeholders}))))`
        );
        params.push(...grant.ids, ...grant.ids);
      } else {
        access.push(
          "(v.visibility = 'group' AND (v.share_group_id IS NOT NULL OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id)))"
        );
      }
    }

    if (user.role === 'admin') {
      access.push(
        "(v.visibility = 'group' AND (v.share_group_id IS NOT NULL OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id)))"
      );
    } else if (groupIds.length > 0) {
      const placeholders = groupIds.map(() => '?').join(', ');
      access.push(
        `(v.visibility = 'group' ${audienceSql} AND (v.share_group_id IN (${placeholders}) OR EXISTS (SELECT 1 FROM ticket_view_groups vg WHERE vg.view_id = v.id AND vg.group_id IN (${placeholders}))))`
      );
      params.push(...(audiences || []), ...groupIds, ...groupIds);
    }

    db.query(
      `SELECT v.*, u.email AS creator_email, g.name AS share_group_name,
              (v.user_id = ?) AS is_owner
       FROM ticket_views v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN \`groups\` g ON g.id = v.share_group_id
       WHERE IFNULL(v.hidden, 0) = 0
         AND v.scope IN (?, 'admin', 'technician')
         AND (${access.join(' OR ')})
       ORDER BY v.sort_order ASC, v.name ASC`,
      params,
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener vistas' });
        res.json(rows.map(serializeView));
      }
    );
  });
};

exports.getViewLayout = (req, res) => {
  db.query(
    'SELECT item_key, sort_order FROM user_view_layout WHERE user_id = ? ORDER BY sort_order ASC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener orden de vistas' });
      res.json({ order: rows.map((row) => row.item_key) });
    }
  );
};

exports.saveViewLayout = (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ message: 'order debe ser un array' });
  }

  const keys = order.map((key) => String(key).trim()).filter((key) => key.length > 0 && key.length <= 80);

  db.query('DELETE FROM user_view_layout WHERE user_id = ?', [req.user.id], (delErr) => {
    if (delErr) return res.status(500).json({ message: 'Error al actualizar orden' });
    if (keys.length === 0) return res.json({ message: 'Orden guardado', order: [] });

    const values = keys.map((key, index) => [req.user.id, key, index]);
    db.query('INSERT INTO user_view_layout (user_id, item_key, sort_order) VALUES ?', [values], (insErr) => {
      if (insErr) return res.status(500).json({ message: 'Error al guardar orden' });
      res.json({ message: 'Orden guardado', order: keys });
    });
  });
};

exports.createView = (req, res) => {
  validateViewPayload(req.body, req.user, (err, payload) => {
    if (err) return res.status(400).json({ message: err.message });

    db.query(
      `INSERT INTO ticket_views (user_id, name, scope, visibility, share_group_id, filters, sort_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        payload.name,
        payload.scope,
        payload.visibility,
        payload.share_group_id,
        JSON.stringify(payload.filters),
        payload.sort_by,
        payload.sort_order
      ],
      (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: 'Error al crear vista' });
        const viewId = result.insertId;
        replaceViewGroups(viewId, payload.share_group_ids || [], (groupErr) => {
          if (groupErr) {
            db.query('DELETE FROM ticket_views WHERE id = ?', [viewId], () => {
              res.status(500).json({ message: 'Error al guardar grupos' });
            });
            return;
          }
          fetchSerializedView(viewId, req.user.id, (selErr, view) => {
            if (selErr || !view) return res.status(500).json({ message: 'Error al obtener vista creada' });
            res.status(201).json(view);
          });
        });
      }
    );
  });
};

exports.updateView = (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM ticket_views WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al verificar vista' });
    if (rows.length === 0) return res.status(404).json({ message: 'Vista no encontrada' });

    const existing = rows[0];
    const isOwner = existing.user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tenés permiso para editar esta vista' });
    }

    validateViewPayload(req.body, req.user, (valErr, payload) => {
      if (valErr) return res.status(400).json({ message: valErr.message });

      db.query(
        `UPDATE ticket_views
         SET name = ?, visibility = ?, share_group_id = ?, filters = ?, sort_by = ?, sort_order = ?
         WHERE id = ?`,
        [
          payload.name,
          payload.visibility,
          payload.share_group_id,
          JSON.stringify(payload.filters),
          payload.sort_by,
          payload.sort_order,
          id
        ],
        (updErr) => {
          if (updErr) return res.status(500).json({ message: 'Error al actualizar vista' });
          replaceViewGroups(id, payload.share_group_ids || [], (groupErr) => {
            if (groupErr) return res.status(500).json({ message: 'Error al guardar grupos' });
            fetchSerializedView(id, req.user.id, (selErr, view) => {
              if (selErr || !view) return res.status(500).json({ message: 'Error al obtener vista' });
              res.json(view);
            });
          });
        }
      );
    });
  });
};

exports.deleteView = (req, res) => {
  const { id } = req.params;

  db.query('SELECT user_id FROM ticket_views WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al verificar vista' });
    if (rows.length === 0) return res.status(404).json({ message: 'Vista no encontrada' });

    const isOwner = rows[0].user_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tenés permiso para eliminar esta vista' });
    }

    db.query('DELETE FROM ticket_views WHERE id = ?', [id], (delErr, result) => {
      if (delErr) return res.status(500).json({ message: 'Error al eliminar vista' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Vista no encontrada' });
      db.query('DELETE FROM user_view_layout WHERE item_key = ?', [`view:${id}`], () =>
        res.json({ message: 'Vista eliminada' })
      );
    });
  });
};

const saveAdminView = (req, res, existingId) => {
  validateViewPayload(req.body, { ...req.user, role: 'admin' }, (err, payload) => {
    if (err) return res.status(400).json({ message: err.message });
    const finish = (viewId, statusCode) => {
      replaceViewGroups(viewId, payload.share_group_ids || [], (groupErr) => {
        if (groupErr) {
          if (!existingId) {
            db.query('DELETE FROM ticket_views WHERE id = ?', [viewId], () => {
              res.status(500).json({ message: 'Error al guardar grupos' });
            });
            return;
          }
          return res.status(500).json({ message: 'Error al guardar grupos' });
        }
        fetchSerializedView(viewId, req.user.id, (selErr, view) => {
          if (selErr || !view) return res.status(500).json({ message: 'Error al obtener vista' });
          if (statusCode === 201) return res.status(201).json(view);
          res.json(view);
        });
      });
    };

    if (!existingId) {
      db.query(
        `INSERT INTO ticket_views
          (user_id, name, scope, visibility, share_group_id, filters, sort_by, sort_order, audience, hidden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          req.user.id,
          payload.name,
          payload.scope,
          payload.visibility,
          payload.share_group_id,
          JSON.stringify(payload.filters),
          payload.sort_by,
          payload.sort_order,
          null
        ],
        (insertErr, result) => {
          if (insertErr) return res.status(500).json({ message: 'Error al crear vista' });
          finish(result.insertId, 201);
        }
      );
      return;
    }

    db.query(
      `UPDATE ticket_views
       SET name = ?, visibility = ?, share_group_id = ?, filters = ?, sort_by = ?, audience = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.visibility,
        payload.share_group_id,
        JSON.stringify(payload.filters),
        payload.sort_by,
        null,
        existingId
      ],
      (updErr) => {
        if (updErr) return res.status(500).json({ message: 'Error al actualizar vista' });
        finish(existingId, 200);
      }
    );
  });
};

exports.listAdminViews = (req, res) => {
  db.query(
    `SELECT v.*, u.email AS creator_email, g.name AS share_group_name,
            (v.user_id = ?) AS is_owner
     FROM ticket_views v
     JOIN users u ON u.id = v.user_id
     LEFT JOIN \`groups\` g ON g.id = v.share_group_id
     ORDER BY v.created_at DESC, v.name ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener vistas' });
      loadShareGroups(
        rows.map((row) => row.id),
        (groupErr, map) => {
          if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });
          res.json(rows.map((row) => serializeView(row, groupsForRow(row, map))));
        }
      );
    }
  );
};

exports.createAdminView = (req, res) => saveAdminView(req, res, null);

exports.updateAdminView = (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.query('SELECT id FROM ticket_views WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al verificar vista' });
    if (!rows.length) return res.status(404).json({ message: 'Vista no encontrada' });
    saveAdminView(req, res, id);
  });
};

exports.setAdminViewHidden = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const hidden = req.body.hidden ? 1 : 0;
  db.query('SELECT id FROM ticket_views WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al verificar vista' });
    if (!rows.length) return res.status(404).json({ message: 'Vista no encontrada' });
    db.query('UPDATE ticket_views SET hidden = ? WHERE id = ?', [hidden, id], (updErr) => {
      if (updErr) return res.status(500).json({ message: 'Error al actualizar la vista' });
      res.json({ message: hidden ? 'Vista oculta' : 'Vista visible', hidden: Boolean(hidden) });
    });
  });
};

exports.deleteAdminView = (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.query('DELETE FROM ticket_views WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al eliminar vista' });
    if (!result.affectedRows) return res.status(404).json({ message: 'Vista no encontrada' });
    db.query('DELETE FROM user_view_layout WHERE item_key = ?', [`view:${id}`], () => {
      res.json({ message: 'Vista eliminada' });
    });
  });
};

exports.VALID_SCOPES = VALID_SCOPES;
