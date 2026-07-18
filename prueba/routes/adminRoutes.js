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
  getUser,
  updateUserRole
} = require('../controllers/adminController');

const {
  getSlaPolicies,
  updateSlaPolicies
} = require('../controllers/slaController');
const {
  getGroups,
  getGroupById,
  getTechnicians,
  createGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groupsController');

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
router.get('/users/:id', getUser);
router.patch('/users/:id/role', updateUserRole);

router.get('/sla-policies', getSlaPolicies);
router.put('/sla-policies', updateSlaPolicies);

router.get('/groups', getGroups);
router.get('/groups/technicians', getTechnicians);
router.get('/groups/:id', getGroupById);
router.post('/groups', createGroup);
router.patch('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

module.exports = router;
