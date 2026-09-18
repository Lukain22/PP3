const db = require('../db/db');

const IMPORTANT_FIELDS = ['status', 'priority', 'type', 'technician_id', 'group_id'];

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

const createNotification = ({ userId, ticketId, type, title, message, actorUserId }) => {
  if (!userId || !ticketId || !type || !title || !message) return;
  if (actorUserId && Number(userId) === Number(actorUserId)) return;

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
    default:
      return null;
  }
};

const notifyTicketCreatorOnChanges = (ticket, actorUserId, oldTicket, updates) => {
  const creatorId = ticket.user_id;
  if (!creatorId || Number(creatorId) === Number(actorUserId)) return;

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

  createNotification({
    userId: creatorId,
    ticketId: ticket.id,
    type: 'ticket_updated',
    title: `Actualización en "${ticket.title}"`,
    message: changes.join(' · '),
    actorUserId
  });
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
  notifyTicketCreatorOnChanges,
  notifyTicketCreatorOnResolution,
  notifyOnComment
};
