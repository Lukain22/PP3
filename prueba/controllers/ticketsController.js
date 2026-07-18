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

const SLA_SELECT = 'sla_response_due, sla_resolution_due, sla_status, sla_paused_at';

const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];

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
  const { status } = req.query;

  const baseWhere = status && VALID_STATUSES.includes(status)
    ? 'WHERE user_id = ? AND status = ?'
    : 'WHERE user_id = ?';
  const baseParams = status && VALID_STATUSES.includes(status)
    ? [req.user.id, status]
    : [req.user.id];

  db.query(
    `SELECT COUNT(*) AS total FROM tickets ${baseWhere}`,
    baseParams,
    (err, countResult) => {
      if (err) return res.status(500).json({ message: 'Error al obtener tickets' });

      const total = countResult[0].total;

      db.query(
        `SELECT id, title, description, status, priority, type, ${SLA_SELECT}, created_at, user_id
         FROM tickets ${baseWhere}
         ORDER BY created_at DESC
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
    `SELECT t.*, g.name AS group_name, u.email AS user_email
     FROM tickets t
     LEFT JOIN \`groups\` g ON g.id = t.group_id
     LEFT JOIN users u ON u.id = t.user_id
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
  const { title, description, status, priority, type } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (!title || !description) {
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
        description,
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
  const role = req.user.role;
  const isStaff = role === 'admin' || role === 'technician';

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  if (!isStaff && status === 'on-hold') {
    return res.status(403).json({ message: 'No tenés permiso para poner el ticket en espera' });
  }

  loadTicketWithAccess(req, id, (selectErr, oldTicket) => {
    if (selectErr) return res.status(500).json({ message: 'Error al obtener ticket' });
    if (!oldTicket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const oldStatus = oldTicket.status;

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
          res.json({ message: 'Estado actualizado' });
        }
      );
    });
  });
};

exports.updateTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, type } = req.body;
  const role = req.user.role;
  const isAdmin = role === 'admin';
  const isTechnician = role === 'technician';

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ message: 'El título no puede estar vacío' });
  }
  if (description !== undefined && !String(description).trim()) {
    return res.status(400).json({ message: 'La descripción no puede estar vacía' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (isTechnician && (title !== undefined || description !== undefined || priority !== undefined || type !== undefined)) {
    return res.status(403).json({ message: 'Como técnico solo podés cambiar el estado del ticket' });
  }
  if (!isAdmin && !isTechnician && (status !== undefined || priority !== undefined || type !== undefined)) {
    return res.status(403).json({ message: 'No tenés permiso para cambiar estado, prioridad o tipo' });
  }
  if (!isAdmin && status === 'on-hold') {
    return res.status(403).json({ message: 'No tenés permiso para poner el ticket en espera' });
  }

  const effectiveType = type !== undefined ? type : undefined;
  const effectivePriority = priority !== undefined ? priority : undefined;

  if (effectiveType === 'requirement' && effectivePriority !== undefined) {
    return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
  }
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: 'Prioridad inválida' });
  }

  loadTicketWithAccess(req, id, (selectErr, oldTicket) => {
    if (selectErr) return res.status(500).json({ message: 'Error al obtener ticket' });
    if (!oldTicket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const nextType = type !== undefined ? type : oldTicket.type;

    if (nextType === 'requirement' && priority !== undefined && priority !== null) {
      return res.status(400).json({ message: 'Los requerimientos no tienen prioridad' });
    }

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
      if (description !== undefined) {
        fields.push('description = ?');
        values.push(String(description).trim());
        updates.description = String(description).trim();
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
          res.json({ message: 'Ticket actualizado' });
        }
      );
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
       ORDER BY h.created_at DESC`,
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
  const { id } = req.params;
  const { content } = req.body;
  const role = req.user.role;

  if (role !== 'admin' && role !== 'technician') {
    return res.status(403).json({ message: 'Solo técnicos o administradores pueden registrar resoluciones' });
  }
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'La resolución no puede estar vacía' });
  }

  loadTicketWithAccess(req, id, (err, ticket) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const trimmed = String(content).trim();

    db.query('SELECT id FROM ticket_resolutions WHERE ticket_id = ?', [id], (selErr, existing) => {
      if (selErr) return res.status(500).json({ message: 'Error al verificar resolución' });

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
  const isAdmin = req.user.role === 'admin';

  const sql = isAdmin
    ? 'DELETE FROM tickets WHERE id = ?'
    : 'DELETE FROM tickets WHERE id = ? AND user_id = ?';
  const params = isAdmin ? [id] : [id, req.user.id];

  db.query(sql, params, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al eliminar ticket' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json({ message: 'Ticket eliminado' });
    }
  );
};

exports.initTicketsTable = initTicketsTable;
exports.initCommentsTable = initCommentsTable;
