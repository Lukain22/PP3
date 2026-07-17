const db = require('../db/db');
const { logTicketHistory, logFieldChanges, logTicketCreated } = require('../utils/ticketHistory');

const VALID_STATUSES = ['open', 'in-progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];

const initTicketsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
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
        `SELECT id, title, description, status, priority, type, created_at, user_id
         FROM tickets ${baseWhere}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...baseParams, limit, offset],
        (err2, results) => {
          if (err2) return res.status(500).json({ message: 'Error al obtener tickets' });
          res.json({
            data: results,
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
  const isAdmin = req.user.role === 'admin';

  const sql = isAdmin
    ? 'SELECT id, title, description, status, priority, type, category, subcategory, created_at, updated_at, user_id FROM tickets WHERE id = ?'
    : 'SELECT id, title, description, status, priority, type, created_at, updated_at, user_id FROM tickets WHERE id = ? AND user_id = ?';
  const params = isAdmin ? [id] : [id, req.user.id];

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener ticket' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }
    res.json(results[0]);
  });
};

exports.createTicket = (req, res) => {
  const { title, description, status, priority, type } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (!title || !description) {
    return res.status(400).json({ message: 'Título y descripción son requeridos' });
  }

  const ticketType = type && VALID_TYPES.includes(type) ? type : 'incident';
  const ticketStatus = isAdmin ? (status || 'open') : 'open';
  const ticketPriority = isAdmin ? (priority || 'medium') : 'medium';

  db.query(
    'INSERT INTO tickets (title, description, status, priority, type, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, ticketStatus, ticketPriority, ticketType, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al crear ticket' });
      }

      const ticketId = result.insertId;
      logTicketCreated(ticketId, req.user.id, {
        type: ticketType,
        status: ticketStatus,
        priority: ticketPriority,
        title: String(title).trim()
      });

      res.status(201).json({
        message: 'Ticket creado',
        id: ticketId
      });
    }
  );
};

exports.updateTicketStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  const selectSql = isAdmin
    ? 'SELECT status FROM tickets WHERE id = ?'
    : 'SELECT status FROM tickets WHERE id = ? AND user_id = ?';
  const selectParams = isAdmin ? [id] : [id, req.user.id];

  db.query(selectSql, selectParams, (selectErr, rows) => {
    if (selectErr) {
      return res.status(500).json({ message: 'Error al obtener ticket' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const oldStatus = rows[0].status;
    const updateSql = isAdmin
      ? 'UPDATE tickets SET status = ? WHERE id = ?'
      : 'UPDATE tickets SET status = ? WHERE id = ? AND user_id = ?';
    const updateParams = isAdmin ? [status, id] : [status, id, req.user.id];

    db.query(updateSql, updateParams, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar ticket' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      if (oldStatus !== status) {
        logTicketHistory(id, req.user.id, 'updated', 'status', oldStatus, status);
      }
      res.json({ message: 'Estado actualizado' });
    });
  });
};

exports.updateTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, type } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ message: 'El título no puede estar vacío' });
  }
  if (description !== undefined && !String(description).trim()) {
    return res.status(400).json({ message: 'La descripción no puede estar vacía' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: 'Prioridad inválida' });
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  if (!isAdmin && (status !== undefined || priority !== undefined || type !== undefined)) {
    return res.status(403).json({ message: 'No tenés permiso para cambiar estado, prioridad o tipo' });
  }

  const selectSql = isAdmin
    ? 'SELECT * FROM tickets WHERE id = ?'
    : 'SELECT * FROM tickets WHERE id = ? AND user_id = ?';
  const selectParams = isAdmin ? [id] : [id, req.user.id];

  db.query(selectSql, selectParams, (selectErr, rows) => {
    if (selectErr) {
      return res.status(500).json({ message: 'Error al obtener ticket' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const oldTicket = rows[0];
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

    if (isAdmin) {
      values.push(id);
    } else {
      values.push(id, req.user.id);
    }

    const where = isAdmin ? 'WHERE id = ?' : 'WHERE id = ? AND user_id = ?';

    db.query(
      `UPDATE tickets SET ${fields.join(', ')} ${where}`,
      values,
      (err, result) => {
        if (err) {
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

exports.getTicketHistory = (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? 'SELECT id FROM tickets WHERE id = ?'
    : 'SELECT id FROM tickets WHERE id = ? AND user_id = ?';
  const checkParams = isAdmin ? [id] : [id, req.user.id];

  db.query(checkSql, checkParams, (checkErr, tickets) => {
    if (checkErr) {
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
          return res.status(500).json({ message: 'Error al obtener historial' });
        }
        res.json(history);
      }
    );
  });
};

exports.getTicketComments = (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? 'SELECT id FROM tickets WHERE id = ?'
    : 'SELECT id FROM tickets WHERE id = ? AND user_id = ?';
  const checkParams = isAdmin ? [id] : [id, req.user.id];

  db.query(checkSql, checkParams, (err, tickets) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar ticket' });
    }
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    db.query(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.email
       FROM ticket_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [id],
      (commentErr, comments) => {
        if (commentErr) {
          return res.status(500).json({ message: 'Error al obtener comentarios' });
        }
        res.json(comments);
      }
    );
  });
};

exports.addTicketComment = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  const checkSql = isAdmin
    ? 'SELECT id FROM tickets WHERE id = ?'
    : 'SELECT id FROM tickets WHERE id = ? AND user_id = ?';
  const checkParams = isAdmin ? [id] : [id, req.user.id];

  db.query(checkSql, checkParams, (err, tickets) => {
      if (err) {
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
            return res.status(500).json({ message: 'Error al agregar comentario' });
          }

          res.status(201).json({
            message: 'Comentario agregado',
            id: result.insertId
          });
        }
      );
    }
  );
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
