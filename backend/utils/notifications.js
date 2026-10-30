const db = require('../db/db');
const { computeSlaStatus } = require('./sla');

const IMPORTANT_FIELDS = [
  'status',
  'priority',
  'type',
  'technician_id',
  'group_id',
  'title',
  'description',
  'category',
  'subcategory'
];

const DUE_CHECK_MS = 10 * 60 * 1000;

const STATUS_LABELS = {
  open: 'Abierto',
  'in-progress': 'En proceso',
  'on-hold': 'En espera',
  resolved: 'Resuelto'
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const TYPE_LABELS = {
  incident: 'Incidente',
  requirement: 'Requerimiento'
};

const initNotificationsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      ticket_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      actor_user_id INT NULL DEFAULT NULL,
      read_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_notifications_user_read (user_id, read_at),
      INDEX idx_notifications_user_created (user_id, created_at)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Error creando tabla notifications:', err.code || err);
    } else {
      console.log('Tabla notifications lista');
    }
  });
};

const createNotification = ({ userId, ticketId, type, title, message, actorUserId, allowSelf = false }) => {
  if (!userId || !ticketId || !type || !title || !message) return;
  if (!allowSelf && actorUserId && Number(userId) === Number(actorUserId)) return;

  db.query(
    `INSERT INTO notifications (user_id, ticket_id, type, title, message, actor_user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, ticketId, type, title, message, actorUserId || null],
    (err) => {
      if (err) {
        console.error('Error creando notificación:', err.code || err);
      }
    }
  );
};

const formatFieldChange = (field, oldVal, newVal) => {
  switch (field) {
    case 'status':
      return `Estado: ${STATUS_LABELS[oldVal] || oldVal || '—'} → ${STATUS_LABELS[newVal] || newVal}`;
    case 'priority':
      return `Prioridad: ${PRIORITY_LABELS[oldVal] || oldVal || '—'} → ${PRIORITY_LABELS[newVal] || newVal || '—'}`;
    case 'type':
      return `Tipo: ${TYPE_LABELS[oldVal] || oldVal || '—'} → ${TYPE_LABELS[newVal] || newVal}`;
    case 'technician_id':
      if (!oldVal && newVal) return 'Se asignó un técnico';
      if (oldVal && !newVal) return 'Se quitó la asignación del técnico';
      return 'Cambió el técnico asignado';
    case 'group_id':
      return 'Cambió el grupo del ticket';
    case 'title':
      return 'Cambió el título';
    case 'description':
      return 'Cambió la descripción';
    case 'category':
      return 'Cambió la categoría';
    case 'subcategory':
      return 'Cambió la subcategoría';
    default:
      return null;
  }
};

const clipTitle = (title) => {
  const text = String(title || '').trim() || 'Ticket';
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const notifyUsers = (userIds, payload) => {
  [...new Set(userIds.map((id) => Number(id)).filter((id) => id > 0))].forEach((userId) => {
    createNotification({ ...payload, userId });
  });
};

const loadWatchers = (ticket, callback) => {
  const ids = new Set();
  if (ticket.user_id) ids.add(Number(ticket.user_id));
  if (ticket.technician_id) ids.add(Number(ticket.technician_id));

  const finish = (extraIds) => {
    extraIds.forEach((id) => ids.add(Number(id)));
    callback([...ids].filter((id) => id > 0));
  };

  if (ticket.technician_id || !ticket.group_id) {
    if (ticket.technician_id || ticket.user_id) {
      finish([]);
      return;
    }
    db.query("SELECT id FROM users WHERE role = 'admin'", (err, rows) => {
      finish(err || !rows ? [] : rows.map((row) => row.id));
    });
    return;
  }

  db.query('SELECT user_id FROM user_groups WHERE group_id = ?', [ticket.group_id], (err, rows) => {
    const members = !err && rows ? rows.map((row) => row.user_id) : [];
    if (members.length) {
      finish(members);
      return;
    }
    db.query("SELECT id FROM users WHERE role = 'admin'", (adminErr, admins) => {
      finish(!adminErr && admins ? admins.map((row) => row.id) : []);
    });
  });
};

const formatDueLabel = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const notifyTicketCreated = (ticket, actorUserId) => {
  if (ticket.user_id) {
    createNotification({
      userId: ticket.user_id,
      ticketId: ticket.id,
      type: 'ticket_created',
      title: `Ticket creado: "${clipTitle(ticket.title)}"`,
      message: 'Tu solicitud quedó registrada.',
      actorUserId,
      allowSelf: true
    });
  }

  loadWatchers(ticket, (userIds) => {
    notifyUsers(userIds, {
      ticketId: ticket.id,
      type: 'ticket_created',
      title: `Nuevo ticket: "${clipTitle(ticket.title)}"`,
      message: 'Se creó una solicitud en tu grupo.',
      actorUserId
    });
  });
};

const notifyTicketCreatorOnChanges = (ticket, actorUserId, oldTicket, updates) => {
  const changes = [];
  IMPORTANT_FIELDS.forEach((field) => {
    if (updates[field] === undefined) return;
    const oldVal = oldTicket[field];
    const newVal = updates[field];
    if (String(oldVal ?? '') === String(newVal ?? '')) return;
    const text = formatFieldChange(field, oldVal, newVal);
    if (text) changes.push(text);
  });

  if (changes.length === 0) return;

  const merged = {
    ...ticket,
    ...updates,
    id: ticket.id,
    title: updates.title !== undefined ? updates.title : ticket.title
  };

  loadWatchers(merged, (userIds) => {
    notifyUsers(userIds, {
      ticketId: ticket.id,
      type: 'ticket_updated',
      title: `Actualización en "${clipTitle(merged.title)}"`,
      message: changes.join(' · '),
      actorUserId
    });
  });
};

const notifyUpcomingDeadlines = () => {
  db.query(
    `SELECT id, title, user_id, technician_id, group_id, type, status, created_at, updated_at,
            sla_response_due, sla_resolution_due
     FROM tickets
     WHERE type = 'incident'
       AND status IN ('open', 'in-progress')
       AND sla_resolution_due IS NOT NULL`,
    (err, rows) => {
      if (err || !rows) {
        if (err) console.error('Error buscando vencimientos:', err.code || err);
        return;
      }

      rows.forEach((ticket) => {
        if (computeSlaStatus(ticket) !== 'at_risk') return;
        const dueLabel = formatDueLabel(ticket.sla_resolution_due);
        if (!dueLabel) return;
        const message = `El vencimiento de resolución es ${dueLabel}.`;

        db.query(
          'SELECT id FROM notifications WHERE ticket_id = ? AND type = ? AND message = ? LIMIT 1',
          [ticket.id, 'sla_due', message],
          (selErr, existing) => {
            if (selErr || (existing && existing.length)) return;
            loadWatchers(ticket, (userIds) => {
              notifyUsers(userIds, {
                ticketId: ticket.id,
                type: 'sla_due',
                title: `Próximo vencimiento: "${clipTitle(ticket.title)}"`,
                message,
                actorUserId: null
              });
            });
          }
        );
      });
    }
  );
};

const startDueNotifications = () => {
  setTimeout(notifyUpcomingDeadlines, 5000);
  const timer = setInterval(notifyUpcomingDeadlines, DUE_CHECK_MS);
  if (typeof timer.unref === 'function') timer.unref();
};

const notifyTicketCreatorOnResolution = (ticket, actorUserId, isUpdate) => {
  const creatorId = ticket.user_id;
  if (!creatorId || Number(creatorId) === Number(actorUserId)) return;

  createNotification({
    userId: creatorId,
    ticketId: ticket.id,
    type: 'resolution_added',
    title: isUpdate ? `Resolución actualizada en "${ticket.title}"` : `Ticket resuelto: "${ticket.title}"`,
    message: isUpdate
      ? 'Se actualizó la resolución de tu solicitud.'
      : 'Tu solicitud fue marcada como resuelta.',
    actorUserId
  });
};

const notifyOnComment = (ticket, actorUserId, actorRole) => {
  if (actorRole === 'user') {
    const technicianId = ticket.technician_id;
    if (!technicianId || Number(technicianId) === Number(actorUserId)) return;

    createNotification({
      userId: technicianId,
      ticketId: ticket.id,
      type: 'new_comment',
      title: `Nuevo comentario en "${ticket.title}"`,
      message: 'El solicitante dejó una nota en el ticket.',
      actorUserId
    });
    return;
  }

  if (actorRole === 'admin' || actorRole === 'technician') {
    const creatorId = ticket.user_id;
    if (!creatorId || Number(creatorId) === Number(actorUserId)) return;

    createNotification({
      userId: creatorId,
      ticketId: ticket.id,
      type: 'new_comment',
      title: `Nuevo comentario en "${ticket.title}"`,
      message: 'El equipo de soporte dejó una nota en tu solicitud.',
      actorUserId
    });
  }
};

module.exports = {
  initNotificationsTable,
  createNotification,
  notifyTicketCreated,
  notifyTicketCreatorOnChanges,
  notifyTicketCreatorOnResolution,
  notifyOnComment,
  notifyUpcomingDeadlines,
  startDueNotifications
};
