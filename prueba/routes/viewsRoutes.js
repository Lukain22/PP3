const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const technicianMiddleware = require('../middleware/technicianMiddleware');
const {
  getViews,
  createView,
  updateView,
  deleteView
} = require('../controllers/viewsController');

router.use(authMiddleware, technicianMiddleware);

router.get('/', getViews);
router.post('/', createView);
router.patch('/:id', updateView);
router.delete('/:id', deleteView);

module.exports = router;
