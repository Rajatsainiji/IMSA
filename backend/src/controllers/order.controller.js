const orderService = require('../services/order.service');
const ApiResponse = require('../utils/ApiResponse');

class OrderController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
      const result = await orderService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        startDate,
        endDate
      });

      return ApiResponse.paginated(res, result.orders, {
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await orderService.getById(req.params.id);
      return ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await orderService.create({ ...req.body, userId: req.user.id });
      return ApiResponse.created(res, order, 'Order placed successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.success(res, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const order = await orderService.cancel(
        req.params.id,
        req.user.id,
        req.body.reason
      );
      return ApiResponse.success(res, order, 'Order cancelled and stock restored');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await orderService.getStats();
      return ApiResponse.success(res, stats, 'Order statistics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
