// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, refreshToken } = require('../middlewares/auth');
const { validateRegistration, validateLogin } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Local authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/logout', isAuthenticated, authController.logout);

// Token refresh route
router.post('/refresh-token', refreshToken);

// User profile routes
router.get('/profile', isAuthenticated, authController.getCurrentUser);
router.put('/profile', isAuthenticated, authController.updateProfile);

// Account management
router.delete('/account', isAuthenticated, authController.deleteAccount);

module.exports = router;
