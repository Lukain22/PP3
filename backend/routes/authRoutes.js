const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { getMe, updatePreferences } = require('../controllers/rolesController');

const authAttemptLimit = {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos, probá de nuevo en unos minutos' }
};

router.post('/register', register);
router.post('/login', rateLimit(authAttemptLimit), login);
router.get('/me', authMiddleware, getMe);
router.patch('/preferences', authMiddleware, updatePreferences);
router.post('/forgot-password', rateLimit(authAttemptLimit), forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
