// middlewares/validation.js

const { query, body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation Error', errors: errors.array().map(e => e.msg) });
  }
  next();
};

// Validates common activity list/query params (page, limit, date range)
const validateActivityQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  query('userId').optional().isMongoId().withMessage('userId must be a valid id'),
  handleValidation
];

const validateRegistration = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  handleValidation
];

const validateLogin = [
  body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required'),
  handleValidation
];

const validateFileUpdate = [
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  handleValidation
];

const validateFolderCreation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('parentId').optional().isMongoId().withMessage('parentId must be a valid id'),
  handleValidation
];

const validateFolderUpdate = [
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  handleValidation
];

const validateShareCreation = [
  body('email').isEmail().withMessage('a valid email is required').normalizeEmail(),
  body('permissions').isIn(['read', 'write', 'admin']).withMessage('permissions must be read, write, or admin'),
  handleValidation
];

const validateShareUpdate = [
  body('permissions').isIn(['read', 'write', 'admin']).withMessage('permissions must be read, write, or admin'),
  handleValidation
];

module.exports = {
  handleValidation,
  validateActivityQuery,
  validateRegistration,
  validateLogin,
  validateFileUpdate,
  validateFolderCreation,
  validateFolderUpdate,
  validateShareCreation,
  validateShareUpdate
};
