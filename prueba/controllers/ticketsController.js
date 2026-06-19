const db = require('../db/db');

const VALID_STATUSES = ['open', 'in-progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const initTicketsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
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
        `SELECT id, title, description, status, priority, created_at, user_id
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
    ? 'SELECT id, title, description, status, priority, category, subcategory, created_at, updated_at, user_id FROM tickets WHERE id = ?'
    : 'SELECT id, title, description, status, priority, created_at, updated_at, user_id FROM tickets WHERE id = ? AND user_id = ?';
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
  const { title, description, status, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Título y descripción son requeridos' });
  }

  db.query(
    'INSERT INTO tickets (title, description, status, priority, user_id) VALUES (?, ?, ?, ?, ?)',
    [
      title,
      description,
      status || 'open',
      priority || 'medium',
      req.user.id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al crear ticket' });
      }

      res.status(201).json({
        message: 'Ticket creado',
        id: result.insertId
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

  const sql = isAdmin
    ? 'UPDATE tickets SET status = ? WHERE id = ?'
    : 'UPDATE tickets SET status = ? WHERE id = ? AND user_id = ?';
  const params = isAdmin ? [status, id] : [status, id, req.user.id];

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar ticket' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }
    res.json({ message: 'Estado actualizado' });
  });
};

exports.updateTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;

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

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(String(title).trim());
  }
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(String(description).trim());
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }
  if (priority !== undefined) {
    fields.push('priority = ?');
    values.push(priority);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No hay campos para actualizar' });
  }

  const isAdmin = req.user.role === 'admin';
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
      res.json({ message: 'Ticket actualizado' });
    }
  );
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
