const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

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

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      const user = new User({ name, email, password });
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.tokens.push({ token });
      user.refreshTokens.push(refreshToken);
      await user.save();

      res.status(201).json({
        message: 'Registered successfully',
        token,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
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
