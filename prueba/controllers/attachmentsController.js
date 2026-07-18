const fs = require('fs');
const db = require('../db/db');
const { loadTicketWithAccess } = require('./ticketsController');
const { getMimeType, getStoredPath } = require('../utils/attachments');

const mapAttachment = (row) => ({
  id: row.id,
  ticket_id: row.ticket_id,
  user_id: row.user_id,
  original_name: row.original_name,
  mime_type: row.mime_type,
  size_bytes: row.size_bytes,
  created_at: row.created_at,
  uploaded_by_email: row.uploaded_by_email || null
});

exports.getTicketAttachments = (req, res) => {
  const { id } = req.params;

  loadTicketWithAccess(req, id, (accessErr, ticket) => {
    if (accessErr) return res.status(500).json({ message: 'Error al verificar acceso' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      `SELECT a.*, u.email AS uploaded_by_email
       FROM ticket_attachments a
       JOIN users u ON u.id = a.user_id
       WHERE a.ticket_id = ?
       ORDER BY a.created_at ASC`,
      [id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener adjuntos' });
        res.json(Array.isArray(rows) ? rows.map(mapAttachment) : []);
      }
    );
  });
};

exports.uploadTicketAttachments = (req, res) => {
  const { id } = req.params;

  loadTicketWithAccess(req, id, (accessErr, ticket) => {
    if (accessErr) return res.status(500).json({ message: 'Error al verificar acceso' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No se recibieron archivos' });
    }

    const values = files.map((file) => [
      id,
      req.user.id,
      file.originalname,
      file.filename,
      getMimeType(file.originalname),
      file.size
    ]);

    db.query(
      `INSERT INTO ticket_attachments (ticket_id, user_id, original_name, stored_name, mime_type, size_bytes)
       VALUES ?`,
      [values],
      (err) => {
        if (err) {
          files.forEach((file) => {
            fs.unlink(getStoredPath(id, file.filename), () => {});
          });
          return res.status(500).json({ message: 'Error al guardar adjuntos' });
        }

        const storedNames = files.map((file) => file.filename);
        db.query(
          `SELECT a.*, u.email AS uploaded_by_email
           FROM ticket_attachments a
           JOIN users u ON u.id = a.user_id
           WHERE a.ticket_id = ? AND a.stored_name IN (?)
           ORDER BY a.created_at ASC`,
          [id, storedNames],
          (selErr, rows) => {
            if (selErr) {
              return res.status(201).json({
                message: `${files.length} archivo${files.length === 1 ? '' : 's'} adjunto${files.length === 1 ? '' : 's'}`
              });
            }

            res.status(201).json({
              message: `${files.length} archivo${files.length === 1 ? '' : 's'} adjunto${files.length === 1 ? '' : 's'}`,
              data: Array.isArray(rows) ? rows.map(mapAttachment) : []
            });
          }
        );
      }
    );
  });
};

exports.downloadTicketAttachment = (req, res) => {
  const { id, attachmentId } = req.params;

  loadTicketWithAccess(req, id, (accessErr, ticket) => {
    if (accessErr) return res.status(500).json({ message: 'Error al verificar acceso' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      'SELECT * FROM ticket_attachments WHERE id = ? AND ticket_id = ?',
      [attachmentId, id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener adjunto' });
        if (rows.length === 0) return res.status(404).json({ message: 'Adjunto no encontrado' });

        const attachment = rows[0];
        const filePath = getStoredPath(id, attachment.stored_name);

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'Archivo no encontrado en el servidor' });
        }

        res.download(filePath, attachment.original_name);
      }
    );
  });
};

exports.deleteTicketAttachment = (req, res) => {
  const { id, attachmentId } = req.params;
  const role = req.user.role;

  loadTicketWithAccess(req, id, (accessErr, ticket) => {
    if (accessErr) return res.status(500).json({ message: 'Error al verificar acceso' });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    db.query(
      'SELECT * FROM ticket_attachments WHERE id = ? AND ticket_id = ?',
      [attachmentId, id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener adjunto' });
        if (rows.length === 0) return res.status(404).json({ message: 'Adjunto no encontrado' });

        const attachment = rows[0];
        const canDelete = role === 'admin' || attachment.user_id === req.user.id;
        if (!canDelete) {
          return res.status(403).json({ message: 'No tenés permiso para eliminar este adjunto' });
        }

        db.query(
          'DELETE FROM ticket_attachments WHERE id = ? AND ticket_id = ?',
          [attachmentId, id],
          (delErr, result) => {
            if (delErr) return res.status(500).json({ message: 'Error al eliminar adjunto' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Adjunto no encontrado' });

            fs.unlink(getStoredPath(id, attachment.stored_name), () => {});
            res.json({ message: 'Adjunto eliminado' });
          }
        );
      }
    );
  });
};
