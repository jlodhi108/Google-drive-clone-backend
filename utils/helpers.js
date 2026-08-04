// utils/helpers.js

const crypto = require('crypto');
const path = require('path');

const helpers = {
  // Generate a random string of specified length
  generateRandomString: (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  },

  // Hash a password
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  // Compare a password with its hash
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  // Generate a unique filename
  generateUniqueFilename: (originalname) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalname);
    return `${timestamp}-${randomString}${extension}`;
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Sanitize user input
  sanitizeInput: (input) => {
    return input.replace(/[&<>"']/g, (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[char];
    });
  },

  // Parse query parameters for pagination
  parsePaginationParams: (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  },

  // Generate a JWT token
  generateJwtToken: (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
  },

  // Verify a JWT token
  verifyJwtToken: (token, secret) => {
    return jwt.verify(token, secret);
  },

  // Deep clone an object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if a string is a valid MongoDB ObjectId
  isValidObjectId: (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  },

  // Convert a string to slug
  slugify: (string) => {
    return string
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Get file extension
  getFileExtension: (filename) => {
    return path.extname(filename).toLowerCase();
  },

  // Check if file type is allowed
  isAllowedFileType: (filename, allowedTypes) => {
    const ext = helpers.getFileExtension(filename);
    return allowedTypes.includes(ext);
  },

  // Generate a random color
  generateRandomColor: () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  },

  // Format date to a readable string
  formatDate: (date) => {
    return new Date(date).toLocaleString();
  },

  // Calculate time difference
  getTimeDifference: (startDate, endDate) => {
    const diff = endDate.getTime() - startDate.getTime();
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  }
};

module.exports = helpers;