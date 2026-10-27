const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { searchSolutions, applySolution } = require('../controllers/solutionsController');

router.use(authMiddleware);
router.get('/', searchSolutions);
router.post('/:id/apply', applySolution);

module.exports = router;
