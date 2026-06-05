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
  db.query(
    'SELECT id, title, description, status, priority, created_at, user_id FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener tickets' });
      }
      res.json(results);
    }
  );
};

exports.getTicketById = (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT id, title, description, status, priority, created_at, updated_at, user_id FROM tickets WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al obtener ticket' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json(results[0]);
    }
  );
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

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  db.query(
    'UPDATE tickets SET status = ? WHERE id = ? AND user_id = ?',
    [status, id, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar ticket' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
      res.json({ message: 'Estado actualizado' });
    }
  );
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

  values.push(id, req.user.id);

  db.query(
    `UPDATE tickets SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
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

  db.query(
    'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, tickets) => {
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
    }
  );
};

exports.addTicketComment = (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  db.query(
    'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, tickets) => {
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

  db.query(
    'DELETE FROM tickets WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, result) => {
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
