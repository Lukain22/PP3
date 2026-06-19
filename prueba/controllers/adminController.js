const db = require('../db/db');

const VALID_STATUSES = ['open', 'in-progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_ROLES = ['user', 'admin'];

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
  const { status, user_email } = req.query;

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

  const joinClause = 'JOIN users u ON u.id = t.user_id';
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
        `SELECT t.id, t.title, t.description, t.status, t.priority,
                t.category, t.subcategory,
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

exports.getAnyTicket = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority,
            t.category, t.subcategory,
            t.created_at, t.updated_at, t.user_id, u.email AS user_email
     FROM tickets t
     JOIN users u ON u.id = t.user_id
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
      res.json(results[0]);
    }
  );
};

exports.updateAnyTicket = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, subcategory } = req.body;

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
  if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Categoría inválida' });
  }
  if (subcategory !== undefined && subcategory !== null && category !== undefined) {
    const allowed = VALID_SUBCATEGORIES[category] || [];
    if (subcategory !== '' && !allowed.includes(subcategory)) {
      return res.status(400).json({ message: 'Subcategoría inválida para esa categoría' });
    }
  }

  const fields = [];
  const values = [];

  if (title !== undefined) { fields.push('title = ?'); values.push(String(title).trim()); }
  if (description !== undefined) { fields.push('description = ?'); values.push(String(description).trim()); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (priority !== undefined) { fields.push('priority = ?'); values.push(priority); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category || null); }
  if (subcategory !== undefined) { fields.push('subcategory = ?'); values.push(subcategory || null); }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No hay campos para actualizar' });
  }

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
      res.json({ message: 'Ticket actualizado' });
    }
  );
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

exports.getUsers = (req, res) => {
  db.query(
    'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error('Error en getUsers:', err.code);
        return res.status(500).json({ message: 'Error al obtener usuarios' });
      }
      res.json(results);
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
  const { role } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: 'No podés cambiar tu propio rol' });
  }

  db.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, id],
    (err, result) => {
      if (err) {
        console.error('Error en updateUserRole:', err.code);
        return res.status(500).json({ message: 'Error al actualizar rol' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json({ message: 'Rol actualizado' });
    }
  );
};
