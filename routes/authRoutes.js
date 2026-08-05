// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, refreshToken } = require('../middlewares/auth');
const { validateRegistration, validateLogin, validateVerifyOtp, validateResendOtp, validateForgotPassword, validateResetPassword } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: 'Too many verification attempts, please try again after 15 minutes'
});

// Local authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/verify-otp', otpLimiter, validateVerifyOtp, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validateResendOtp, authController.resendOtp);
router.post('/forgot-password', otpLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', otpLimiter, validateResetPassword, authController.resetPassword);
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
