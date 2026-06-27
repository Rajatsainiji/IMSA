const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const data = await dashboardService.getSummary();
      return ApiResponse.success(res, data, 'Dashboard summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const products = await dashboardService.getTopProducts(limit);
      return ApiResponse.success(res, products, 'Top products retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
