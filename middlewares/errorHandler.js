// middleware/errorHandler.js

const mongoose = require('mongoose');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => e.message);
  }

  // Mongoose cast error (invalid ID)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID';
  }

  // Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate Key Error';
    errors = Object.keys(err.keyValue).map(key => `${key} already exists`);
  }

  // JWT authentication error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // JWT token expired error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Custom application errors
  else if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // File upload error
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size limit exceeded';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: config.env === 'development' ? err.stack : undefined
  });
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, AppError, catchAsync };