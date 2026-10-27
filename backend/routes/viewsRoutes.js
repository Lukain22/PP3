const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission, requireViewWrite } = require('../rbac/guard');
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
router.post('/', requireViewWrite('create'), createView);
router.patch('/:id', requireViewWrite('edit'), updateView);
router.delete('/:id', requirePermission('views.edit'), deleteView);

module.exports = router;
