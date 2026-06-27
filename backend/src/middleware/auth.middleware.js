const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/app');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');


//  Verify JWT token and attach user to request

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, 'Token has expired');
      }
      return ApiResponse.unauthorized(res, 'Invalid token');
    }

    const user = await User.scope('withToken').findOne({
      where: { id: decoded.id, isActive: true },
      attributes: ['id', 'name', 'email', 'role', 'isActive']
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new AppError('Authentication failed', 500));
  }
};


//  Role-based access control middleware factory

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

// Optional authentication - attaches user if token present, doesn't fail if not

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findOne({
          where: { id: decoded.id, isActive: true },
          attributes: ['id', 'name', 'email', 'role']
        });
        req.user = user;
      } catch {
        // Token invalid - continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
