const { Category, Product } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');

class CategoryController {
  async getAll(req, res, next) {
    try {
      const categories = await Category.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']]
      });
      return ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await Category.findByPk(req.params.id, {
        include: [{ model: Product, as: 'products', attributes: ['id', 'name', 'sku'] }]
      });
      if (!category) throw new AppError('Category not found', 404);
      return ApiResponse.success(res, category);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await Category.create(req.body);
      return ApiResponse.created(res, category, 'Category created');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) throw new AppError('Category not found', 404);
      await category.update(req.body);
      return ApiResponse.success(res, category, 'Category updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) throw new AppError('Category not found', 404);
      await category.update({ isActive: false });
      return ApiResponse.success(res, null, 'Category deactivated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
