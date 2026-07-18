const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getViews,
  createView,
  updateView,
  deleteView,
  getViewLayout,
  saveViewLayout
} = require('../controllers/viewsController');

router.use(authMiddleware);

router.get('/', getViews);
router.get('/layout', getViewLayout);
router.put('/layout', saveViewLayout);
router.post('/', createView);
router.patch('/:id', updateView);
router.delete('/:id', deleteView);

module.exports = router;
