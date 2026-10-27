const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const technicianMiddleware = require('../middleware/technicianMiddleware');
const { requirePermission } = require('../rbac/guard');
const {
  getTechnicianTickets,
  getTechnicianGroups,
  getTechnicianGroupById
} = require('../controllers/technicianController');

router.use(authMiddleware, technicianMiddleware, requirePermission('tickets.view'));

router.get('/tickets', getTechnicianTickets);
router.get('/groups', getTechnicianGroups);
router.get('/groups/:id', getTechnicianGroupById);

module.exports = router;
