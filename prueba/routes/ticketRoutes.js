const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  updateTicket,
  getTicketComments,
  addTicketComment,
  deleteTicket
} = require('../controllers/ticketsController');

router.get('/', authMiddleware, getTickets);
router.post('/', authMiddleware, createTicket);
router.get('/:id/comments', authMiddleware, getTicketComments);
router.post('/:id/comments', authMiddleware, addTicketComment);
router.get('/:id', authMiddleware, getTicketById);
router.put('/:id', authMiddleware, updateTicketStatus);
router.patch('/:id', authMiddleware, updateTicket);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
