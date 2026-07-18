const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const technicianMiddleware = require('../middleware/technicianMiddleware');
const {
  getTechnicianTickets,
  getTechnicianGroups
} = require('../controllers/technicianController');

router.use(authMiddleware, technicianMiddleware);

router.get('/tickets', getTechnicianTickets);
router.get('/groups', getTechnicianGroups);

module.exports = router;
