const db = require('../db/db');

const initTicketsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla tickets:', err);
    } else {
      console.log('Tabla tickets lista');
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

const VALID_STATUSES = ['open', 'in-progress', 'resolved'];

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
