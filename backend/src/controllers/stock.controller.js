const stockService = require('../services/stock.service');
const ApiResponse = require('../utils/ApiResponse');

class StockController {
  async getByProduct(req, res, next) {
    try {
      const stock = await stockService.getByProductId(req.params.productId);
      return ApiResponse.success(res, stock, 'Stock retrieved');
    } catch (error) {
      next(error);
    }
  }

  async addStock(req, res, next) {
    try {
      const stock = await stockService.addStock({
        productId: req.params.productId,
        quantity: parseInt(req.body.quantity),
        notes: req.body.notes,
        userId: req.user.id
      });
      return ApiResponse.success(res, stock, 'Stock added successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeStock(req, res, next) {
    try {
      const stock = await stockService.removeStock({
        productId: req.params.productId,
        quantity: parseInt(req.body.quantity),
        notes: req.body.notes,
        userId: req.user.id
      });
      return ApiResponse.success(res, stock, 'Stock removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const stock = await stockService.adjustStock({
        productId: req.params.productId,
        newQuantity: parseInt(req.body.newQuantity),
        notes: req.body.notes,
        userId: req.user.id
      });
      return ApiResponse.success(res, stock, 'Stock adjusted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { page = 1, limit = 20, movementType } = req.query;
      const result = await stockService.getHistory({
        productId: req.params.productId,
        page: parseInt(page),
        limit: parseInt(limit),
        movementType
      });

      return ApiResponse.paginated(res, result.histories, {
        total: result.total,
        page: result.page,
        limit: result.limit
      }, 'Stock history retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAllHistory(req, res, next) {
    try {
      const { page = 1, limit = 20, movementType, productId } = req.query;
      const result = await stockService.getAllHistory({
        page: parseInt(page),
        limit: parseInt(limit),
        movementType,
        productId
      });

      return ApiResponse.paginated(res, result.histories, {
        total: result.total,
        page: result.page,
        limit: result.limit
      }, 'Stock history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StockController();
