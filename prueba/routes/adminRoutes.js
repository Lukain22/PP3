const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getAllTickets,
  getAnyTicket,
  updateAnyTicket,
  deleteAnyTicket,
  getAnyTicketHistory,
  getAnyTicketComments,
  addAnyTicketComment,
  updateAnyComment,
  deleteAnyComment,
  getUsers,
  updateUserRole
} = require('../controllers/adminController');

router.use(authMiddleware, roleMiddleware);

router.get('/tickets', getAllTickets);
router.get('/tickets/:id/history', getAnyTicketHistory);
router.get('/tickets/:id', getAnyTicket);
router.patch('/tickets/:id', updateAnyTicket);
router.delete('/tickets/:id', deleteAnyTicket);
router.get('/tickets/:id/comments', getAnyTicketComments);
router.post('/tickets/:id/comments', addAnyTicketComment);
router.patch('/comments/:commentId', updateAnyComment);
router.delete('/comments/:commentId', deleteAnyComment);

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
