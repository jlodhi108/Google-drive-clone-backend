const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.refreshTokenSecret, { expiresIn: config.refreshTokenExpiration });
};

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      let user = await User.findOne({ email });
      if (user && user.isVerified) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      if (!user) {
        user = new User({ name, email, password });
      } else {
        // Unverified user retrying registration (e.g. the verification email never arrived)
        user.name = name;
        user.password = password;
      }
      const otp = user.generateOtp();
      await user.save();

      await emailService.sendOtpEmail(user.email, otp);

      res.status(201).json({
        message: 'Registration successful. Please check your email for a verification code.',
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  },

  // Verify a registered email using the emailed OTP
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email }).select('+otp +otpExpires');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }
      if (!user.matchOtp(otp)) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;

      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      user.tokens.push({ token });
      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: 'Email verified successfully',
        token,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying code', error: error.message });
    }
  },

  // Resend a fresh OTP to an unverified account
  resendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const otp = user.generateOtp();
      await user.save();
      await emailService.sendOtpEmail(user.email, otp);

      res.json({ message: 'Verification code resent' });
    } catch (error) {
      res.status(500).json({ message: 'Error resending code', error: error.message });
    }
  },

  // Request a password reset code
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (user) {
        const otp = user.generateOtp();
        await user.save();
        await emailService.sendPasswordResetEmail(user.email, otp);
      }

      res.json({ message: 'If that email is registered, a reset code has been sent.' });
    } catch (error) {
      res.status(500).json({ message: 'Error requesting password reset', error: error.message });
    }
  },

  // Reset password using the emailed code
  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({ email }).select('+otp +otpExpires');
      if (!user || !user.matchOtp(otp)) {
        return res.status(400).json({ message: 'Invalid or expired reset code' });
      }

      user.password = newPassword;
      user.otp = undefined;
      user.otpExpires = undefined;
      user.tokens = [];
      user.refreshTokens = [];
      await user.save();

      res.json({ message: 'Password reset successful. Please log in with your new password.' });
    } catch (error) {
      res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
  },

  // Login with email and password
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      if (!user.isVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in', email: user.email });
      }

      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.tokens.push({ token });
      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: 'Logged in successfully',
        token,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  },

  // Log out the current session (revoke this token only)
  logout: async (req, res) => {
    try {
      req.user.tokens = req.user.tokens.filter(t => t.token !== req.token);
      await req.user.save();
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error logging out', error: error.message });
    }
  },

  // Get current authenticated user
  getCurrentUser: (req, res) => {
    res.json(req.user);
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = req.user;

      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete user account
  deleteAccount: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user._id);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = authController;
