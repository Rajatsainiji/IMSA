const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const config = require('../config/app');

// Handle Sequelize validation errors

const handleSequelizeValidationError = (err) => {
  const errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  return { message: 'Validation failed', errors, statusCode: 422 };
};

// Handle Sequelize unique constraint errors
 
const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors?.[0]?.path || 'field';
  return { message: `${field} already exists`, errors: null, statusCode: 409 };
};

// Handle JWT errors

const handleJWTError = () => ({ message: 'Invalid token', errors: null, statusCode: 401 });
const handleJWTExpiredError = () => ({ message: 'Token expired', errors: null, statusCode: 401 });

//  Global error handling middleware
//  Must be last middleware registered
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
  } else {
    logger.warn('Client Error:', { message, statusCode, url: req.url });
  }

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    const parsed = handleSequelizeValidationError(err);
    return ApiResponse.validationError(res, parsed.errors, parsed.message);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const parsed = handleSequelizeUniqueConstraintError(err);
    return ApiResponse.conflict(res, parsed.message);
  }

  if (err.name === 'JsonWebTokenError') {
    const parsed = handleJWTError();
    return ApiResponse.unauthorized(res, parsed.message);
  }

  if (err.name === 'TokenExpiredError') {
    const parsed = handleJWTExpiredError();
    return ApiResponse.unauthorized(res, parsed.message);
  }

  // In development, send full error details
  if (config.app.isDevelopment && !err.isOperational) {
    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

// Handle 404 routes

const notFoundHandler = (req, res) => {
  ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = { errorHandler, notFoundHandler };
