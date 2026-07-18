const db = require('../db/db');
const { getUserGroupIds, userCanAccessTicket } = require('../utils/groups');
const { enrichTickets } = require('../utils/sla');

const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];

exports.getTechnicianTickets = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { status } = req.query;

  getUserGroupIds(req.user.id, (groupErr, groupIds) => {
    if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });

    if (groupIds.length === 0) {
      return res.json({ data: [], total: 0, page, limit, totalPages: 0 });
    }

    const placeholders = groupIds.map(() => '?').join(', ');
    const conditions = [`t.group_id IN (${placeholders})`];
    const params = [...groupIds];

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    db.query(
      `SELECT COUNT(*) AS total FROM tickets t ${whereClause}`,
      params,
      (err, countResult) => {
        if (err) return res.status(500).json({ message: 'Error al obtener tickets' });

        const total = countResult[0].total;

        db.query(
          `SELECT t.id, t.title, t.description, t.status, t.priority, t.type,
                  t.group_id, g.name AS group_name,
                  t.sla_response_due, t.sla_resolution_due, t.sla_status,
                  t.created_at, t.updated_at, t.user_id, u.email AS user_email
           FROM tickets t
           JOIN users u ON u.id = t.user_id
           LEFT JOIN \`groups\` g ON g.id = t.group_id
           ${whereClause}
           ORDER BY t.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, limit, offset],
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
  });
};

exports.getTechnicianGroups = (req, res) => {
  db.query(
    `SELECT g.id, g.name, g.description, g.is_default
     FROM \`groups\` g
     JOIN user_groups ug ON ug.group_id = g.id
     WHERE ug.user_id = ?
     ORDER BY g.name ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error al obtener grupos' });
      res.json(rows);
    }
  );
};

exports.checkTicketAccess = (req, res, next) => {
  const { id } = req.params;

  db.query('SELECT * FROM tickets WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al verificar ticket' });
    if (rows.length === 0) return res.status(404).json({ message: 'Ticket no encontrado' });

    const ticket = rows[0];

    if (req.user.role === 'admin') {
      req.ticket = ticket;
      return next();
    }

    getUserGroupIds(req.user.id, (groupErr, groupIds) => {
      if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });
      if (!userCanAccessTicket(req.user, ticket, groupIds)) {
        return res.status(403).json({ message: 'No tenés acceso a este ticket' });
      }
      req.ticket = ticket;
      next();
    });
  });
};
