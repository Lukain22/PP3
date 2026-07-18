const db = require('../db/db');
const { logFieldChanges } = require('../utils/ticketHistory');
const {
  loadPolicies,
  enrichTicket,
  enrichTickets,
  applySlaFieldsToUpdate,
  appendSlaToFields
} = require('../utils/sla');

const SLA_SELECT = 't.sla_response_due, t.sla_resolution_due, t.sla_status';

const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];
const VALID_ROLES = ['user', 'admin', 'technician'];

const VALID_CATEGORIES = [
  'Hardware',
  'Software',
  'Red / Conectividad',
  'Acceso / Cuentas',
  'Otro'
];

const VALID_SUBCATEGORIES = {
  'Hardware':            ['Computadora / Notebook', 'Impresora', 'Proyector', 'Periféricos', 'Otro'],
  'Software':            ['Sistema operativo', 'Aplicaciones', 'Correo electrónico', 'Antivirus', 'Otro'],
  'Red / Conectividad':  ['Internet', 'Wi-Fi', 'Red local', 'VPN', 'Otro'],
  'Acceso / Cuentas':    ['Contraseña olvidada', 'Permisos', 'Usuario nuevo', 'Campus virtual', 'Otro'],
  'Otro':                ['Consulta general', 'Otro']
};

exports.getAllTickets = (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { status, user_email, group_id } = req.query;

  const conditions = [];
  const baseParams = [];

  if (status && VALID_STATUSES.includes(status)) {
    conditions.push('t.status = ?');
    baseParams.push(status);
  }
  if (user_email && String(user_email).trim()) {
    conditions.push('u.email LIKE ?');
    baseParams.push(`%${String(user_email).trim()}%`);
  }
  if (group_id && String(group_id).trim()) {
    conditions.push('t.group_id = ?');
    baseParams.push(parseInt(group_id, 10));
  }

  const joinClause = 'JOIN users u ON u.id = t.user_id LEFT JOIN `groups` g ON g.id = t.group_id';
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.query(
    `SELECT COUNT(*) AS total FROM tickets t ${joinClause} ${whereClause}`,
    baseParams,
    (err, countResult) => {
      if (err) {
        console.error('Error en getAllTickets count:', err.code);
        return res.status(500).json({ message: 'Error al obtener tickets' });
      }

      const total = countResult[0].total;

      db.query(
        `SELECT t.id, t.title, t.description, t.status, t.priority, t.type,
                t.category, t.subcategory, t.group_id, g.name AS group_name, ${SLA_SELECT},
                t.created_at, t.updated_at, t.user_id, u.email AS user_email
         FROM tickets t
         ${joinClause}
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [...baseParams, limit, offset],
        (err2, results) => {
          if (err2) {
            console.error('Error en getAllTickets data:', err2.code);
            return res.status(500).json({ message: 'Error al obtener tickets' });
          }
          res.json({
            data: enrichTickets(results),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          });
        }
      );
    }
  );
};

exports.getAnyTicket = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority, t.type,
            t.category, t.subcategory, t.group_id, g.name AS group_name, ${SLA_SELECT},
            t.created_at, t.updated_at, t.user_id, u.email AS user_email
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN \`groups\` g ON g.id = t.group_id
     WHERE t.id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error('Error en getAnyTicket:', err.code);
        return res.status(500).json({ message: 'Error al obtener ticket' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json(enrichTicket(results[0]));
    }
  );
};

exports.updateAnyTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, subcategory, type, group_id } = req.body;

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ message: 'El título no puede estar vacío' });
  }
  if (description !== undefined && !String(description).trim()) {
    return res.status(400).json({ message: 'La descripción no puede estar vacía' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: 'Prioridad inválida' });
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (type === 'requirement' && priority !== undefined && priority !== null) {
    return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
  }
  if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoría inválida' });
  }
  if (subcategory !== undefined && subcategory !== null && category !== undefined) {
    const allowed = VALID_SUBCATEGORIES[category] || [];
    if (subcategory !== '' && !allowed.includes(subcategory)) {
      return res.status(400).json({ message: 'Subcategoría inválida para esa categoría' });
    }
  }

  const applyUpdate = (oldTicket) => {
    const nextType = type !== undefined ? type : oldTicket.type;

    loadPolicies((policyErr, policies) => {
      if (policyErr) {
        console.error('Error cargando políticas SLA:', policyErr.code);
        return res.status(500).json({ message: 'Error al cargar políticas SLA' });
      }

      const fields = [];
      const values = [];
      const updates = {};

      if (title !== undefined) { fields.push('title = ?'); values.push(String(title).trim()); updates.title = String(title).trim(); }
      if (description !== undefined) { fields.push('description = ?'); values.push(String(description).trim()); updates.description = String(description).trim(); }
      if (status !== undefined) { fields.push('status = ?'); values.push(status); updates.status = status; }
      if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); updates.priority = priority; }
      if (type !== undefined) { fields.push('type = ?'); values.push(type); updates.type = type; }
      if (category !== undefined) { fields.push('category = ?'); values.push(category || null); updates.category = category || null; }
      if (subcategory !== undefined) { fields.push('subcategory = ?'); values.push(subcategory || null); updates.subcategory = subcategory || null; }
      if (group_id !== undefined) { fields.push('group_id = ?'); values.push(group_id); updates.group_id = group_id; }

      if (fields.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
      }

      const mergedUpdates = { ...updates };
      if (nextType === 'requirement') {
        mergedUpdates.priority = null;
      }

      const slaFields = applySlaFieldsToUpdate(oldTicket, mergedUpdates, policies);
      appendSlaToFields(fields, values, updates, slaFields);

      values.push(id);

      db.query(
        `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
        values,
        (err, result) => {
          if (err) {
            console.error('Error en updateAnyTicket:', err.code);
            return res.status(500).json({ message: 'Error al actualizar ticket' });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
          }
          logFieldChanges(id, req.user.id, oldTicket, updates);
          res.json({ message: 'Ticket actualizado' });
        }
      );
    });
  };

  db.query('SELECT * FROM tickets WHERE id = ?', [id], (selectErr, rows) => {
    if (selectErr) {
      console.error('Error en updateAnyTicket select:', selectErr.code);
      return res.status(500).json({ message: 'Error al obtener ticket' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const oldTicket = rows[0];
    const nextType = type !== undefined ? type : oldTicket.type;

    if (nextType === 'requirement' && priority !== undefined && priority !== null) {
      return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
    }

    if (group_id !== undefined) {
      return db.query('SELECT id FROM `groups` WHERE id = ?', [group_id], (gErr, gRows) => {
        if (gErr) return res.status(500).json({ message: 'Error al verificar grupo' });
        if (gRows.length === 0) return res.status(400).json({ message: 'Grupo inválido' });
        applyUpdate(oldTicket);
      });
    }

    applyUpdate(oldTicket);
  });
};

exports.getAnyTicketHistory = (req, res) => {
  const { id } = req.params;

  db.query('SELECT id FROM tickets WHERE id = ?', [id], (checkErr, tickets) => {
    if (checkErr) {
      console.error('Error en getAnyTicketHistory check:', checkErr.code);
      return res.status(500).json({ message: 'Error al verificar ticket' });
    }
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    db.query(
      `SELECT h.id, h.action, h.field_name, h.old_value, h.new_value, h.created_at, u.email
       FROM ticket_history h
       JOIN users u ON u.id = h.user_id
       WHERE h.ticket_id = ?
       ORDER BY h.created_at DESC`,
      [id],
      (err, history) => {
        if (err) {
          console.error('Error en getAnyTicketHistory:', err.code);
          return res.status(500).json({ message: 'Error al obtener historial' });
        }
        res.json(history);
      }
    );
  });
};

exports.deleteAnyTicket = (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM tickets WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error en deleteAnyTicket:', err.code);
        return res.status(500).json({ message: 'Error al eliminar ticket' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json({ message: 'Ticket eliminado' });
    }
  );
};

exports.getAnyTicketComments = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT c.id, c.content, c.created_at, c.user_id, u.email
     FROM ticket_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.ticket_id = ?
     ORDER BY c.created_at ASC`,
    [id],
    (err, comments) => {
      if (err) {
        console.error('Error en getAnyTicketComments:', err.code);
        return res.status(500).json({ message: 'Error al obtener comentarios' });
      }
      res.json(comments);
    }
  );
};

exports.addAnyTicketComment = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  db.query(
    'SELECT id FROM tickets WHERE id = ?',
    [id],
    (err, tickets) => {
      if (err) {
        console.error('Error verificando ticket:', err.code);
        return res.status(500).json({ message: 'Error al verificar ticket' });
      }
      if (tickets.length === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }

      db.query(
        'INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
        [id, req.user.id, String(content).trim()],
        (insertErr, result) => {
          if (insertErr) {
            console.error('Error en addAnyTicketComment:', insertErr.code);
            return res.status(500).json({ message: 'Error al agregar comentario' });
          }
          res.status(201).json({ message: 'Comentario agregado', id: result.insertId });
        }
      );
    }
  );
};

exports.getUser = (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT id, email, role, created_at FROM users WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) {
        console.error('Error en getUser:', err.code);
        return res.status(500).json({ message: 'Error al obtener usuario' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      db.query(
        `SELECT g.id, g.name
         FROM user_groups ug
         JOIN \`groups\` g ON g.id = ug.group_id
         WHERE ug.user_id = ?
         ORDER BY g.name ASC`,
        [id],
        (err2, groups) => {
          if (err2) {
            console.error('Error en getUser groups:', err2.code);
            return res.status(500).json({ message: 'Error al obtener grupos del usuario' });
          }
          res.json({ ...rows[0], groups });
        }
      );
    }
  );
};

exports.getUsers = (req, res) => {
  db.query(
    'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        console.error('Error en getUsers:', err.code);
        return res.status(500).json({ message: 'Error al obtener usuarios' });
      }

      db.query(
        `SELECT ug.user_id, g.id, g.name
         FROM user_groups ug
         JOIN \`groups\` g ON g.id = ug.group_id`,
        (err2, links) => {
          if (err2) {
            console.error('Error en getUsers groups:', err2.code);
            return res.status(500).json({ message: 'Error al obtener grupos de usuarios' });
          }

          const result = users.map((u) => ({
            ...u,
            groups: links
              .filter((l) => l.user_id === u.id)
              .map((l) => ({ id: l.id, name: l.name }))
          }));
          res.json(result);
        }
      );
    }
  );
};

exports.updateAnyComment = (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  db.query(
    'UPDATE ticket_comments SET content = ? WHERE id = ?',
    [String(content).trim(), commentId],
    (err, result) => {
      if (err) {
        console.error('Error en updateAnyComment:', err.code);
        return res.status(500).json({ message: 'Error al editar comentario' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Comentario no encontrado' });
      }
      res.json({ message: 'Comentario actualizado' });
    }
  );
};

exports.deleteAnyComment = (req, res) => {
  const { commentId } = req.params;

  db.query(
    'DELETE FROM ticket_comments WHERE id = ?',
    [commentId],
    (err, result) => {
      if (err) {
        console.error('Error en deleteAnyComment:', err.code);
        return res.status(500).json({ message: 'Error al eliminar comentario' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Comentario no encontrado' });
      }
      res.json({ message: 'Comentario eliminado' });
    }
  );
};

exports.updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role, group_ids } = req.body;

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  if (Number(id) === req.user.id && role !== undefined) {
    return res.status(400).json({ message: 'No podés cambiar tu propio rol' });
  }

  if (role === 'technician' && group_ids !== undefined && (!Array.isArray(group_ids) || group_ids.length === 0)) {
    return res.status(400).json({ message: 'Un técnico debe pertenecer al menos a un grupo' });
  }

  db.query('SELECT id FROM users WHERE id = ?', [id], (selErr, rows) => {
    if (selErr) return res.status(500).json({ message: 'Error al obtener usuario' });
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const applyGroups = (done) => {
      if (group_ids === undefined) return done();
      db.query('DELETE FROM user_groups WHERE user_id = ?', [id], (delErr) => {
        if (delErr) return done(delErr);
        if (!group_ids.length) return done();
        let pending = group_ids.length;
        group_ids.forEach((gid) => {
          db.query('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [id, gid], (insErr) => {
            if (insErr) return done(insErr);
            pending -= 1;
            if (pending === 0) done();
          });
        });
      });
    };

    const finish = (err) => {
      if (err) {
        console.error('Error en updateUserRole:', err.code || err);
        return res.status(500).json({ message: 'Error al actualizar usuario' });
      }
      res.json({ message: 'Usuario actualizado' });
    };

    if (role !== undefined) {
      db.query('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
        if (err) return finish(err);
        applyGroups(finish);
      });
    } else {
      applyGroups(finish);
    }
  });
};
