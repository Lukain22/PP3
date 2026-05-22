const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTickets,
  createTicket,
  updateTicketStatus,
  deleteTicket
} = require('../controllers/ticketsController');

router.get('/', authMiddleware, getTickets);
router.post('/', authMiddleware, createTicket);
router.put('/:id', authMiddleware, updateTicketStatus);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
