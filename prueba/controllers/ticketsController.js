const db = require('../db/db');
const { logTicketHistory, logFieldChanges, logTicketCreated } = require('../utils/ticketHistory');
const {
  loadPolicies,
  buildIncidentSla,
  clearSlaFields,
  resolveSlaForTicket,
  enrichTicket,
  enrichTickets,
  applySlaFieldsToUpdate,
  appendSlaToFields,
  formatDateForDb
} = require('../utils/sla');
const { getDefaultGroupId, getUserGroupIds, userCanAccessTicket } = require('../utils/groups');
const { appendListFilters, resolveTicketOrderBy, VALID_CATEGORIES, VALID_SUBCATEGORIES } = require('../utils/ticketFilters');
const {
  notifyTicketCreatorOnChanges,
  notifyTicketCreatorOnResolution,
  notifyOnComment
} = require('../utils/notifications');
const { assertPermission, assertTicketMutation } = require('../rbac/guard');
const { sanitizeDescription, isEmptyDescription } = require('../utils/richText');

const SLA_SELECT = 'sla_response_due, sla_resolution_due, sla_status, sla_paused_at';

const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];

const clearResolutionOnReopen = (ticketId, oldStatus, newStatus, done) => {
  if (oldStatus === 'resolved' && newStatus && newStatus !== 'resolved') {
    return db.query('DELETE FROM ticket_resolutions WHERE ticket_id = ?', [ticketId], (err) => done(err));
  }
  done(null);
};

const loadTicketWithAccess = (req, ticketId, callback) => {
  db.query('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(null, null);

    const ticket = rows[0];
    const role = req.user.role;

    if (role === 'admin') return callback(null, ticket);

    if (role === 'technician') {
      return getUserGroupIds(req.user.id, (groupErr, groupIds) => {
        if (groupErr) return callback(groupErr);
        if (!userCanAccessTicket(req.user, ticket, groupIds)) return callback(null, null);
        callback(null, ticket);
      });
    }

    if (ticket.user_id === req.user.id) return callback(null, ticket);
    callback(null, null);
  });
};

const initTicketsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      priority VARCHAR(50) DEFAULT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'incident',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla tickets:', err);
    } else {
      console.log('Tabla tickets lista');
      db.query(
        'ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        () => {}
      );
    }
  });
};

const initCommentsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla ticket_comments:', err);
    } else {
      console.log('Tabla ticket_comments lista');
    }
  });
};

exports.getTickets = (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { status, type, priority, sort } = req.query;
  const orderBy = resolveTicketOrderBy(sort, 'user');

  const conditions = ['user_id = ?'];
  const baseParams = [req.user.id];

  appendListFilters(conditions, baseParams, { status, type, priority });

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  db.query(
    `SELECT COUNT(*) AS total FROM tickets t ${whereClause}`,
    baseParams,
    (err, countResult) => {
      if (err) return res.status(500).json({ message: 'Error al obtener tickets' });

      const total = countResult[0].total;

      db.query(
        `SELECT id, title, description, status, priority, type, group_id, ${SLA_SELECT}, created_at, user_id
         FROM tickets t
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...baseParams, limit, offset],
        (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Error al obtener tickets' });
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

exports.getTicketById = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT t.*, g.name AS group_name, u.email AS user_email, tech.email AS technician_email
     FROM tickets t
     LEFT JOIN \`groups\` g ON g.id = t.group_id
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN users tech ON tech.id = t.technician_id
     WHERE t.id = ?`,
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error al obtener ticket' });
      if (results.length === 0) return res.status(404).json({ message: 'Ticket no encontrado' });

      const ticket = results[0];
      const role = req.user.role;

      if (role === 'admin') {
        return res.json(enrichTicket(ticket));
      }

      if (role === 'technician') {
        return getUserGroupIds(req.user.id, (groupErr, groupIds) => {
          if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });
          if (!userCanAccessTicket(req.user, ticket, groupIds)) {
            return res.status(403).json({ message: 'No tenés acceso a este ticket' });
          }
          res.json(enrichTicket(ticket));
        });
      }

      if (ticket.user_id !== req.user.id) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json(enrichTicket(ticket));
    }
  );
};

exports.createTicket = (req, res) => {
  assertPermission(req, res, 'tickets.create').then((allowed) => {
    if (!allowed) return;
    runCreateTicket(req, res);
  });
};

const runCreateTicket = (req, res) => {
  const { title, description, status, priority, type } = req.body;
  const isAdmin = req.user.role === 'admin';

  const cleanDescription = sanitizeDescription(description);
  if (!title || isEmptyDescription(cleanDescription)) {
    return res.status(400).json({ message: 'Título y descripción son requeridos' });
  }

  const ticketType = type && VALID_TYPES.includes(type) ? type : 'incident';
  const ticketStatus = isAdmin ? (status || 'open') : 'open';

  if (ticketType === 'requirement' && priority !== undefined) {
    return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
  }

    loadPolicies((policyErr, policies) => {
    if (policyErr) {
      return res.status(500).json({ message: 'Error al cargar políticas SLA' });
    }

    getDefaultGroupId((groupErr, defaultGroupId) => {
      if (groupErr) {
        return res.status(500).json({ message: 'Error al obtener grupo principal' });
      }

    let ticketPriority = null;
    let slaFields = clearSlaFields();

    if (ticketType === 'incident') {
      ticketPriority = isAdmin ? (priority || 'medium') : 'medium';
      if (!VALID_PRIORITIES.includes(ticketPriority)) ticketPriority = 'medium';
      const sla = buildIncidentSla(
        { type: 'incident', priority: ticketPriority, created_at: new Date(), status: ticketStatus },
        policies
      );
      slaFields = {
        sla_response_due: formatDateForDb(sla.sla_response_due),
        sla_resolution_due: formatDateForDb(sla.sla_resolution_due),
        sla_status: sla.sla_status
      };
    }

    db.query(
      `INSERT INTO tickets (title, description, status, priority, type, group_id, sla_response_due, sla_resolution_due, sla_status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        cleanDescription,
        ticketStatus,
        ticketPriority,
        ticketType,
        defaultGroupId,
        slaFields.sla_response_due,
        slaFields.sla_resolution_due,
        slaFields.sla_status,
        req.user.id
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error al crear ticket' });
        }

        const ticketId = result.insertId;
        const createdLog = {
          type: ticketType,
          status: ticketStatus,
          title: String(title).trim()
        };
        if (ticketType === 'incident') {
          createdLog.priority = ticketPriority;
        }
        logTicketCreated(ticketId, req.user.id, createdLog);

        res.status(201).json({
          message: 'Ticket creado',
          id: ticketId
        });
      }
    );
    });
  });
};

exports.updateTicketStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  loadTicketWithAccess(req, id, (selectErr, oldTicket) => {
    if (selectErr) return res.status(500).json({ message: 'Error al obtener ticket' });
    if (!oldTicket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const oldStatus = oldTicket.status;

    assertTicketMutation(req, res, oldTicket, { status }).then((allowed) => {
      if (!allowed) return;

    loadPolicies((policyErr, policies) => {
      if (policyErr) {
        return res.status(500).json({ message: 'Error al cargar políticas SLA' });
      }

      const fields = ['status = ?'];
      const values = [status];
      const updates = { status };

      if (oldTicket.type === 'incident') {
        const slaFields = applySlaFieldsToUpdate(oldTicket, { status }, policies);
        appendSlaToFields(fields, values, updates, slaFields);
      }

      values.push(id);

      db.query(
        `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
        values,
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Error al actualizar ticket' });
          if (result.affectedRows === 0) return res.status(404).json({ message: 'Ticket no encontrado' });
          if (oldStatus !== status) {
            logTicketHistory(id, req.user.id, 'updated', 'status', oldStatus, status);
          }
          if (updates.sla_status && updates.sla_status !== oldTicket.sla_status) {
            logTicketHistory(id, req.user.id, 'updated', 'sla_status', oldTicket.sla_status, updates.sla_status);
          }
          clearResolutionOnReopen(id, oldStatus, status, (clearErr) => {
            if (clearErr) return res.status(500).json({ message: 'Error al limpiar resolución' });
            if (oldStatus !== status) {
              notifyTicketCreatorOnChanges(oldTicket, req.user.id, oldTicket, { status });
            }
            res.json({ message: 'Estado actualizado' });
          });
        }
      );
    });
    });
  });
};

exports.updateTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, subcategory, type, technician_id, group_id } = req.body;

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ message: 'El título no puede estar vacío' });
  }
  const cleanDescription = description !== undefined ? sanitizeDescription(description) : undefined;
  if (cleanDescription !== undefined && isEmptyDescription(cleanDescription)) {
    return res.status(400).json({ message: 'La descripción no puede estar vacía' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }

  const effectiveType = type !== undefined ? type : undefined;
  const effectivePriority = priority !== undefined ? priority : undefined;

  if (effectiveType === 'requirement' && effectivePriority !== undefined) {
    return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
  }
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: 'Prioridad inválida' });
  }
  if (category !== undefined && category !== null && category !== '' && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoría inválida' });
  }

  loadTicketWithAccess(req, id, (selectErr, oldTicket) => {
    if (selectErr) return res.status(500).json({ message: 'Error al obtener ticket' });
    if (!oldTicket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const nextType = type !== undefined ? type : oldTicket.type;

    if (nextType === 'requirement' && priority !== undefined && priority !== null) {
      return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
    }

    const nextCategory = category !== undefined ? (category || null) : oldTicket.category;
    if (subcategory !== undefined && subcategory) {
      const allowedSubs = VALID_SUBCATEGORIES[nextCategory] || [];
      if (!allowedSubs.includes(subcategory)) {
        return res.status(400).json({ message: 'Subcategoría inválida para esa categoría' });
      }
    }

    assertTicketMutation(req, res, oldTicket, req.body).then((allowed) => {
      if (!allowed) return;

    const applyUpdate = () => {
      loadPolicies((policyErr, policies) => {
        if (policyErr) {
          return res.status(500).json({ message: 'Error al cargar políticas SLA' });
        }

        const fields = [];
        const values = [];
        const updates = {};

        if (title !== undefined) {
          fields.push('title = ?');
          values.push(String(title).trim());
          updates.title = String(title).trim();
        }
        if (cleanDescription !== undefined) {
          fields.push('description = ?');
          values.push(cleanDescription);
          updates.description = cleanDescription;
        }
        if (status !== undefined) {
          fields.push('status = ?');
          values.push(status);
          updates.status = status;
        }
        if (priority !== undefined) {
          fields.push('priority = ?');
          values.push(priority);
          updates.priority = priority;
        }
        if (type !== undefined) {
          fields.push('type = ?');
          values.push(type);
          updates.type = type;
        }
        if (category !== undefined) {
          fields.push('category = ?');
          values.push(category || null);
          updates.category = category || null;
        }
        if (subcategory !== undefined) {
          fields.push('subcategory = ?');
          values.push(subcategory || null);
          updates.subcategory = subcategory || null;
        }
        if (group_id !== undefined) {
          fields.push('group_id = ?');
          values.push(group_id || null);
          updates.group_id = group_id || null;
        }
        if (technician_id !== undefined) {
          fields.push('technician_id = ?');
          values.push(technician_id || null);
          updates.technician_id = technician_id || null;
        }

        if (fields.length === 0) {
          return res.status(400).json({ message: 'No hay campos para actualizar' });
        }

        const mergedType = type !== undefined ? type : oldTicket.type;
        const mergedUpdates = { ...updates };
        if (mergedType === 'requirement') {
          mergedUpdates.priority = null;
        }

        const slaFields = applySlaFieldsToUpdate(oldTicket, mergedUpdates, policies);
        appendSlaToFields(fields, values, updates, slaFields);

        values.push(id);

        db.query(
          `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
          values,
          (err, result) => {
            if (err) return res.status(500).json({ message: 'Error al actualizar ticket' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Ticket no encontrado' });
            logFieldChanges(id, req.user.id, oldTicket, updates);
            const nextStatus = updates.status !== undefined ? updates.status : oldTicket.status;
            clearResolutionOnReopen(id, oldTicket.status, nextStatus, (clearErr) => {
              if (clearErr) return res.status(500).json({ message: 'Error al limpiar resolución' });
              notifyTicketCreatorOnChanges(oldTicket, req.user.id, oldTicket, updates);
              res.json({ message: 'Ticket actualizado' });
            });
          }
        );
      });
    };

    const applyAssignment = () => {
      if (technician_id === undefined) return applyUpdate();

      const nextTechnicianId = technician_id || null;
      const effectiveGroupId = group_id !== undefined ? group_id : oldTicket.group_id;

      if (!nextTechnicianId) return applyUpdate();

      const parsedTechnicianId = parseInt(nextTechnicianId, 10);
      if (!parsedTechnicianId) {
        return res.status(400).json({ message: 'Técnico inválido' });
      }

      if (!effectiveGroupId) {
        return res.status(400).json({ message: 'Asigná un grupo antes de seleccionar un técnico' });
      }

      db.query(
        `SELECT u.id
         FROM users u
         JOIN user_groups ug ON ug.user_id = u.id
         WHERE u.id = ? AND u.role = 'technician' AND ug.group_id = ?`,
        [parsedTechnicianId, effectiveGroupId],
        (techErr, techRows) => {
          if (techErr) return res.status(500).json({ message: 'Error al verificar técnico' });
          if (techRows.length === 0) {
            return res.status(400).json({ message: 'El técnico no pertenece al grupo del ticket' });
          }
          applyUpdate();
        }
      );
    };

    if (group_id) {
      db.query('SELECT id FROM `groups` WHERE id = ?', [group_id], (gErr, gRows) => {
        if (gErr) return res.status(500).json({ message: 'Error al verificar grupo' });
        if (gRows.length === 0) return res.status(400).json({ message: 'Grupo inválido' });
        applyAssignment();
      });
      return;
    }

    applyAssignment();
    });
  });
};

exports.getTicketHistory = (req, res) => {
  const { id } = req.params;

  loadTicketWithAccess(req, id, (checkErr, ticket) => {
    if (checkErr) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      `SELECT h.id, h.action, h.field_name, h.old_value, h.new_value, h.created_at, u.email
       FROM ticket_history h
       JOIN users u ON u.id = h.user_id
       WHERE h.ticket_id = ?
       ORDER BY h.created_at DESC, h.id DESC`,
      [id],
      (err, history) => {
        if (err) return res.status(500).json({ message: 'Error al obtener historial' });
        res.json(history);
      }
    );
  });
};

exports.getTicketComments = (req, res) => {
  const { id } = req.params;

  loadTicketWithAccess(req, id, (err, ticket) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.email
       FROM ticket_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [id],
      (commentErr, comments) => {
        if (commentErr) return res.status(500).json({ message: 'Error al obtener comentarios' });
        res.json(comments);
      }
    );
  });
};

exports.addTicketComment = (req, res) => {
  assertPermission(req, res, 'tickets.comment').then((allowed) => {
    if (!allowed) return;
    runAddTicketComment(req, res);
  });
};

const runAddTicketComment = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  loadTicketWithAccess(req, id, (err, ticket) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
      [id, req.user.id, String(content).trim()],
      (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: 'Error al agregar comentario' });
        notifyOnComment(ticket, req.user.id, req.user.role);
        res.status(201).json({ message: 'Comentario agregado', id: result.insertId });
      }
    );
  });
};

exports.getTicketResolution = (req, res) => {
  const { id } = req.params;

  loadTicketWithAccess(req, id, (err, ticket) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      `SELECT r.id, r.content, r.created_at, r.updated_at, u.email AS resolved_by_email, u.id AS resolved_by
       FROM ticket_resolutions r
       JOIN users u ON u.id = r.resolved_by
       WHERE r.ticket_id = ?`,
      [id],
      (resErr, rows) => {
        if (resErr) return res.status(500).json({ message: 'Error al obtener resolución' });
        res.json(rows[0] || null);
      }
    );
  });
};

exports.saveTicketResolution = (req, res) => {
  assertPermission(req, res, 'tickets.resolve').then((allowed) => {
    if (!allowed) return;
    runSaveTicketResolution(req, res);
  });
};

const runSaveTicketResolution = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'La resolución no puede estar vacía' });
  }

  loadTicketWithAccess(req, id, (err, ticket) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const trimmed = String(content).trim();

    db.query('SELECT id, content FROM ticket_resolutions WHERE ticket_id = ?', [id], (selErr, existing) => {
      if (selErr) return res.status(500).json({ message: 'Error al verificar resolución' });

      const oldContent = existing.length > 0 ? existing[0].content : null;

      const finish = () => {
        loadPolicies((policyErr, policies) => {
          if (policyErr) return res.status(500).json({ message: 'Error al cargar políticas SLA' });

          const oldStatus = ticket.status;
          const updates = { status: 'resolved' };
          const fields = ['status = ?'];
          const values = ['resolved'];

          if (ticket.type === 'incident') {
            const slaFields = applySlaFieldsToUpdate(ticket, updates, policies);
            appendSlaToFields(fields, values, updates, slaFields);
          }

          values.push(id);

          db.query(
            `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
            values,
            (updErr) => {
              if (updErr) return res.status(500).json({ message: 'Error al marcar ticket como resuelto' });
              if (oldStatus !== 'resolved') {
                logTicketHistory(id, req.user.id, 'updated', 'status', oldStatus, 'resolved');
              }
              if (String(oldContent ?? '') !== trimmed) {
                logTicketHistory(id, req.user.id, 'updated', 'resolution', oldContent, trimmed);
              }
              notifyTicketCreatorOnResolution(ticket, req.user.id, existing.length > 0);
              res.json({ message: existing.length > 0 ? 'Resolución actualizada' : 'Resolución registrada' });
            }
          );
        });
      };

      if (existing.length > 0) {
        db.query(
          'UPDATE ticket_resolutions SET content = ?, resolved_by = ? WHERE ticket_id = ?',
          [trimmed, req.user.id, id],
          (updErr) => {
            if (updErr) return res.status(500).json({ message: 'Error al actualizar resolución' });
            finish();
          }
        );
      } else {
        db.query(
          'INSERT INTO ticket_resolutions (ticket_id, content, resolved_by) VALUES (?, ?, ?)',
          [id, trimmed, req.user.id],
          (insErr) => {
            if (insErr) return res.status(500).json({ message: 'Error al guardar resolución' });
            finish();
          }
        );
      }
    });
  });
};

exports.deleteTicket = (req, res) => {
  const { id } = req.params;

  assertPermission(req, res, 'tickets.delete').then((allowed) => {
    if (!allowed) return;

    loadTicketWithAccess(req, id, (err, ticket) => {
      if (err) return res.status(500).json({ message: 'Error al eliminar ticket' });
      if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

      db.query('DELETE FROM tickets WHERE id = ?', [id], (delErr, result) => {
        if (delErr) return res.status(500).json({ message: 'Error al eliminar ticket' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Ticket no encontrado' });
        res.json({ message: 'Ticket eliminado' });
      });
    });
  });
};

exports.initTicketsTable = initTicketsTable;
exports.initCommentsTable = initCommentsTable;
exports.loadTicketWithAccess = loadTicketWithAccess;

exports.listTransferGroups = async (req, res) => {
  try {
    const { getRequestAccess, query } = require('../rbac/service');
    const access = await getRequestAccess(req);
    if (!access.has('assignments.transfer')) return res.json([]);
    const groups = await query('SELECT id, name FROM `groups` ORDER BY name ASC');
    res.json(groups.filter((group) => access.canTransferTo(group.id)));
  } catch (err) {
    console.error('Error en listTransferGroups:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

exports.listAssigneesByGroup = (req, res) => {
  const { getRequestAccess } = require('../rbac/service');
  const groupId = Number(req.query.group_id);
  if (!groupId) return res.json([]);

  getRequestAccess(req).then((access) => {
    if (!access.has('assignments.self') && !access.has('assignments.others')) return res.json([]);
    if (access.has('assignments.transfer') && !access.canTransferTo(groupId)) return res.json([]);

    db.query(
      `SELECT u.id, u.email
       FROM user_groups ug
       JOIN users u ON u.id = ug.user_id
       WHERE ug.group_id = ? AND u.role = 'technician'
       ORDER BY u.email ASC`,
      [groupId],
      (techErr, rows) => {
        if (techErr) return res.status(500).json({ message: 'Error al obtener técnicos' });
        const list = access.has('assignments.others')
          ? rows
          : rows.filter((row) => Number(row.id) === Number(req.user.id));
        res.json(list);
      }
    );
  }).catch(() => res.status(500).json({ message: 'Error al validar permisos' }));
};
