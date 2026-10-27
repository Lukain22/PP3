const db = require('../db/db');

exports.getNotifications = (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  db.query(
    `SELECT n.id, n.ticket_id, n.type, n.title, n.message, n.read_at, n.created_at,
            n.actor_user_id, u.email AS actor_email, t.title AS ticket_title
     FROM notifications n
     JOIN tickets t ON t.id = n.ticket_id
     LEFT JOIN users u ON u.id = n.actor_user_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT ?`,
    [req.user.id, limit],
    (err, rows) => {
      if (err) {
        console.error('Error en getNotifications:', err.code);
        return res.status(500).json({ message: 'Error al obtener notificaciones' });
      }
      res.json(rows);
    }
  );
};

exports.getUnreadCount = (req, res) => {
  db.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Error en getUnreadCount:', err.code);
        return res.status(500).json({ message: 'Error al obtener notificaciones' });
      }
      res.json({ count: rows[0].count });
    }
  );
};

exports.markNotificationRead = (req, res) => {
  const { id } = req.params;

  db.query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL',
    [id, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error en markNotificationRead:', err.code);
        return res.status(500).json({ message: 'Error al marcar notificación' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }
      res.json({ message: 'Notificación marcada como leída' });
    }
  );
};

exports.markAllNotificationsRead = (req, res) => {
  db.query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
    [req.user.id],
    (err) => {
      if (err) {
        console.error('Error en markAllNotificationsRead:', err.code);
        return res.status(500).json({ message: 'Error al marcar notificaciones' });
      }
      res.json({ message: 'Notificaciones marcadas como leídas' });
    }
  );
};
