const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return ApiResponse.unauthorized(res, 'Refresh token required');
      const result = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return ApiResponse.success(res, user, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
