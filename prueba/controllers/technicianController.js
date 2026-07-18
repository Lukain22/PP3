const db = require('../db/db');
const { getUserGroupIds, userCanAccessTicket } = require('../utils/groups');
const { enrichTickets } = require('../utils/sla');
const { appendListFilters } = require('../utils/ticketFilters');

const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];

exports.getTechnicianTickets = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { status, group_id, type, priority } = req.query;

  getUserGroupIds(req.user.id, (groupErr, groupIds) => {
    if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });

    if (groupIds.length === 0) {
      return res.json({ data: [], total: 0, page, limit, totalPages: 0 });
    }

    const placeholders = groupIds.map(() => '?').join(', ');
    const conditions = [`t.group_id IN (${placeholders})`];
    const params = [...groupIds];

    if (group_id) {
      const filterGroupId = parseInt(group_id, 10);
      if (filterGroupId && !groupIds.includes(filterGroupId)) {
        return res.status(403).json({ message: 'No tenés acceso a ese grupo' });
      }
    }

    appendListFilters(conditions, params, { status, group_id, type, priority });

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
                  t.technician_id, tech.email AS technician_email,
                  t.sla_response_due, t.sla_resolution_due, t.sla_status,
                  t.created_at, t.updated_at, t.user_id, u.email AS user_email
           FROM tickets t
           JOIN users u ON u.id = t.user_id
           LEFT JOIN \`groups\` g ON g.id = t.group_id
           LEFT JOIN users tech ON tech.id = t.technician_id
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

exports.getTechnicianGroupById = (req, res) => {
  const { id } = req.params;
  const groupId = parseInt(id, 10);

  if (!groupId) {
    return res.status(400).json({ message: 'Grupo inválido' });
  }

  getUserGroupIds(req.user.id, (groupErr, groupIds) => {
    if (groupErr) return res.status(500).json({ message: 'Error al obtener grupos' });
    if (!groupIds.includes(groupId)) {
      return res.status(403).json({ message: 'No tenés acceso a este grupo' });
    }

    db.query(
      'SELECT id, name, description, is_default FROM `groups` WHERE id = ?',
      [groupId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener grupo' });
        if (rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado' });

        const group = rows[0];

        db.query(
          `SELECT u.id, u.email
           FROM user_groups ug
           JOIN users u ON u.id = ug.user_id
           WHERE ug.group_id = ? AND u.role = 'technician'
           ORDER BY u.email ASC`,
          [groupId],
          (err2, technicians) => {
            if (err2) return res.status(500).json({ message: 'Error al obtener técnicos del grupo' });
            res.json({ ...group, technicians });
          }
        );
      }
    );
  });
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
