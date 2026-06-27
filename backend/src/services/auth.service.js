const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/app');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {

  // Generate access and refresh tokens

  generateTokens(userId) {
    const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
    const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
    return { accessToken, refreshToken };
  }

// Register a new user

  async register(userData) {
    const existing = await User.findOne({ where: { email: userData.email } });
    if (existing) {
      throw new AppError('Email address is already registered', 409);
    }

    const user = await User.create(userData);
    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Store refresh token
    await User.scope('withToken').update(
      { refreshToken },
      { where: { id: user.id } }
    );

    logger.info(`New user registered: ${user.email}`);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

// Login user with email and password

  async login(email, password) {
    // Use withPassword scope to get password field
    const user = await User.scope('withPassword').findOne({
      where: { email, isActive: true }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Update last login and refresh token
    await user.update({
      lastLoginAt: new Date(),
      refreshToken
    });

    logger.info(`User logged in: ${user.email}`);

    return { user: user.toSafeObject(), accessToken, refreshToken };
  }

// Refresh access token

  async refreshToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.scope('withToken').findOne({
      where: { id: decoded.id, isActive: true, refreshToken: token }
    });

    if (!user) {
      throw new AppError('Refresh token not found or revoked', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    await user.update({ refreshToken });

    return { accessToken, refreshToken };
  }

//  Logout - invalidate refresh token

  async logout(userId) {
    await User.scope('withToken').update(
      { refreshToken: null },
      { where: { id: userId } }
    );
    logger.info(`User logged out: ${userId}`);
  }

//  Get current user profile

  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

//  Update user profile
  
  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const allowedFields = ['name'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    await user.update(updateData);
    return user;
  }

// Change password

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    await user.update({ password: newPassword });
    logger.info(`Password changed for user: ${userId}`);
  }
}

module.exports = new AuthService();
