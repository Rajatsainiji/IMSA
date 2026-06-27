const productService = require('../services/product.service');
const ApiResponse = require('../utils/ApiResponse');

class ProductController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, categoryId, isActive, sortBy, sortOrder } = req.query;
      const result = await productService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        categoryId,
        isActive,
        sortBy,
        sortOrder
      });

      return ApiResponse.paginated(res, result.products, {
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
      const product = await productService.getById(req.params.id);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.body, req.user.id);
      return ApiResponse.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.update(req.params.id, req.body);
      return ApiResponse.success(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await productService.delete(req.params.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const products = await productService.getLowStock();
      return ApiResponse.success(res, products, 'Low stock products retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
