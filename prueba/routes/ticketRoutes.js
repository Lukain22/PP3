const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTicketAttachments,
  uploadTicketAttachments,
  downloadTicketAttachment,
  deleteTicketAttachment
} = require('../controllers/attachmentsController');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  updateTicket,
  getTicketComments,
  addTicketComment,
  deleteTicket,
  getTicketHistory,
  getTicketResolution,
  saveTicketResolution
} = require('../controllers/ticketsController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', authMiddleware, getTickets);
router.post('/', authMiddleware, createTicket);
router.get('/:id/comments', authMiddleware, getTicketComments);
router.get('/:id/history', authMiddleware, getTicketHistory);
router.get('/:id/resolution', authMiddleware, getTicketResolution);
router.get('/:id/attachments', authMiddleware, getTicketAttachments);
router.post('/:id/attachments', authMiddleware, (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Archivo demasiado grande (máx. 10 MB)' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Máximo 5 archivos por vez' });
      }
      return res.status(400).json({ message: err.message || 'Error al subir archivos' });
    }
    next();
  });
}, uploadTicketAttachments);
router.get('/:id/attachments/:attachmentId/download', authMiddleware, downloadTicketAttachment);
router.delete('/:id/attachments/:attachmentId', authMiddleware, deleteTicketAttachment);
router.post('/:id/resolution', authMiddleware, saveTicketResolution);
router.post('/:id/comments', authMiddleware, addTicketComment);
router.get('/:id', authMiddleware, getTicketById);
router.put('/:id', authMiddleware, updateTicketStatus);
router.patch('/:id', authMiddleware, updateTicket);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
