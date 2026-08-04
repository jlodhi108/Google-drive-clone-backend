// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const auth = {
  // Middleware to verify JWT token
  isAuthenticated: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No authentication token, access denied' });
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findOne({ _id: decoded.id, 'tokens.token': token });

      if (!user) {
        throw new Error();
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Please authenticate' });
    }
  },

  // Middleware to check if user is an admin
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  },

  // Middleware to check if user owns the resource
  isResourceOwner: async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await getResourceById(resourceId, req.baseUrl);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (resource.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You do not own this resource.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking resource ownership' });
    }
  },

  // Middleware to check if user has access to shared resource
  hasSharedAccess: async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await getResourceById(resourceId, req.baseUrl);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const hasAccess = await checkSharedAccess(resource, req.user._id);

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied. This resource is not shared with you.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking shared access' });
    }
  },

  // Middleware to refresh token
  refreshToken: async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
      const user = await User.findById(decoded.id);

      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiration });
      user.tokens.push({ token });
      await user.save();
      res.json({ token });
    } catch (error) {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};

// Helper function to get resource by ID based on route
async function getResourceById(id, baseUrl) {
  let Model;
  switch(baseUrl) {
    case '/api/files':
      Model = require('../models/File');
      break;
    case '/api/folders':
      Model = require('../models/Folder');
      break;
    // Add other resource types as needed
    default:
      throw new Error('Invalid resource type');
  }
  return await Model.findById(id);
}

// Helper function to check shared access
async function checkSharedAccess(resource, userId) {
  if (resource.owner.toString() === userId.toString()) {
    return true;
  }

  let SharedModel;
  if (resource.constructor.modelName === 'File') {
    SharedModel = require('../models/SharedFile');
  } else if (resource.constructor.modelName === 'Folder') {
    SharedModel = require('../models/SharedFolder');
  } else {
    throw new Error('Invalid resource type for sharing');
  }

  const sharedResource = await SharedModel.findOne({
    resource: resource._id,
    sharedWith: userId
  });

  return !!sharedResource;
}

module.exports = auth;