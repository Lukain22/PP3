const db = require('../db/db');
const { getUserGroupIds } = require('../utils/groups');
const { normalizeViewFilters } = require('../utils/ticketFilters');

const VALID_SCOPES = ['tickets', 'admin', 'technician'];
const VALID_VISIBILITY = ['personal', 'group'];

const normalizeScope = (scope) => {
  if (scope === 'admin' || scope === 'technician') return 'tickets';
  return scope;
};

const initTicketViewsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      scope VARCHAR(20) NOT NULL,
      visibility VARCHAR(20) NOT NULL DEFAULT 'personal',
      share_group_id INT NULL DEFAULT NULL,
      filters JSON NOT NULL,
      sort_by VARCHAR(50) NOT NULL DEFAULT 'date-desc',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (share_group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL
    )
  `;

  db.query(sql, (err) => {
    if (err) console.error('Error creando tabla ticket_views:', err.code);
    else console.log('Tabla ticket_views lista');
  });

  db.query(
    'ALTER TABLE ticket_views ADD COLUMN sort_order INT NOT NULL DEFAULT 0',
    (alterErr) => {
      if (alterErr && alterErr.errno !== 1060) {
        console.error('Error migrando sort_order en ticket_views:', alterErr.code);
      }
    }
  );

  db.query(
    `CREATE TABLE IF NOT EXISTS user_view_layout (
      user_id INT NOT NULL,
      item_key VARCHAR(80) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, item_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (layoutErr) => {
      if (layoutErr) console.error('Error creando user_view_layout:', layoutErr.code);
    }
  );
};

const serializeView = (row) => ({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  scope: normalizeScope(row.scope),
  visibility: row.visibility,
  share_group_id: row.share_group_id,
  share_group_name: row.share_group_name || null,
  filters: typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters,
  sort_by: row.sort_by,
  sort_order: row.sort_order ?? 0,
  creator_email: row.creator_email || null,
  is_owner: Boolean(Number(row.is_owner)),
  created_at: row.created_at,
  updated_at: row.updated_at
});

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
  if (!VALID_VISIBILITY.includes(vis)) {
    return callback(new Error('Visibilidad inválida'));
  }

  const basePayload = {
    name: String(name).trim(),
    scope: normalizedScope,
    visibility: vis,
    share_group_id: null,
    filters: normalizeViewFilters(filters),
    sort_by: sort_by || 'date-desc',
    sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0
  };

  if (vis !== 'group') {
    return callback(null, basePayload);
  }

  const groupId = parseInt(share_group_id, 10);
  if (!groupId) {
    return callback(new Error('Seleccioná un grupo para compartir la vista'));
  }

  const finish = () => callback(null, { ...basePayload, share_group_id: groupId });

  if (user.role === 'admin') {
    return db.query('SELECT id FROM `groups` WHERE id = ?', [groupId], (err, rows) => {
      if (err) return callback(new Error('Error al verificar grupo'));
      if (rows.length === 0) return callback(new Error('Grupo inválido'));
      finish();
    });
  }

  return getUserGroupIds(user.id, (groupErr, groupIds) => {
    if (groupErr) return callback(new Error('Error al verificar grupos'));
    if (!groupIds.includes(groupId)) {
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

  getUserGroupIds(user.id, (groupErr, groupIds) => {
    if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });

    const params = [user.id, scope, user.id];
    let groupClause = '';

    if (user.role === 'admin') {
      groupClause = "OR (v.visibility = 'group' AND v.share_group_id IS NOT NULL)";
    } else if (groupIds.length > 0) {
      const placeholders = groupIds.map(() => '?').join(', ');
      groupClause = `OR (v.visibility = 'group' AND v.share_group_id IN (${placeholders}))`;
      params.push(...groupIds);
    }

    db.query(
      `SELECT v.*, u.email AS creator_email, g.name AS share_group_name,
              (v.user_id = ?) AS is_owner
       FROM ticket_views v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN \`groups\` g ON g.id = v.share_group_id
       WHERE v.scope IN (?, 'admin', 'technician')
         AND (
           v.user_id = ?
           ${groupClause}
         )
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

  const keys = order
    .map((key) => String(key).trim())
    .filter((key) => key.length > 0 && key.length <= 80);

  db.query('DELETE FROM user_view_layout WHERE user_id = ?', [req.user.id], (delErr) => {
    if (delErr) return res.status(500).json({ message: 'Error al actualizar orden' });
    if (keys.length === 0) return res.json({ message: 'Orden guardado', order: [] });

    const values = keys.map((key, index) => [req.user.id, key, index]);
    db.query(
      'INSERT INTO user_view_layout (user_id, item_key, sort_order) VALUES ?',
      [values],
      (insErr) => {
        if (insErr) return res.status(500).json({ message: 'Error al guardar orden' });
        res.json({ message: 'Orden guardado', order: keys });
      }
    );
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

        db.query(
          `SELECT v.*, u.email AS creator_email, g.name AS share_group_name, 1 AS is_owner
           FROM ticket_views v
           JOIN users u ON u.id = v.user_id
           LEFT JOIN \`groups\` g ON g.id = v.share_group_id
           WHERE v.id = ?`,
          [result.insertId],
          (selErr, rows) => {
            if (selErr) return res.status(500).json({ message: 'Error al obtener vista creada' });
            res.status(201).json(serializeView(rows[0]));
          }
        );
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

          db.query(
            `SELECT v.*, u.email AS creator_email, g.name AS share_group_name,
                    (v.user_id = ?) AS is_owner
             FROM ticket_views v
             JOIN users u ON u.id = v.user_id
             LEFT JOIN \`groups\` g ON g.id = v.share_group_id
             WHERE v.id = ?`,
            [req.user.id, id],
            (selErr, updated) => {
              if (selErr) return res.status(500).json({ message: 'Error al obtener vista' });
              res.json(serializeView(updated[0]));
            }
          );
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
      db.query(
        'DELETE FROM user_view_layout WHERE user_id = ? AND item_key = ?',
        [req.user.id, `view:${id}`],
        () => res.json({ message: 'Vista eliminada' })
      );
    });
  });
};

exports.initTicketViewsTable = initTicketViewsTable;
exports.VALID_SCOPES = VALID_SCOPES;
