const { Op } = require('sequelize');
const { Product, Category, Stock, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { buildSortOptions } = require('../utils/pagination');

class ProductService {

  // Get all products with pagination, filtering, and search

  async getAll({ page = 1, limit = 10, search, categoryId, isActive, sortBy, sortOrder }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    const offset = (page - 1) * limit;
    const order = buildSortOptions(
      { sortBy, sortOrder },
      ['name', 'sku', 'sellingPrice', 'createdAt'],
      'createdAt',
      'DESC'
    );

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Stock, as: 'stock', attributes: ['quantity', 'reservedQuantity', 'lastRestockedAt'] }
      ],
      order,
      limit,
      offset,
      distinct: true
    });

    return { products: rows, total: count, page, limit };
  }

//  Get single product by ID

  async getById(id) {
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Stock, as: 'stock' }
      ]
    });
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

// Create product with initial stock record

  async create(data, userId) {
    const existing = await Product.findOne({ where: { sku: data.sku } });
    if (existing) throw new AppError('SKU already exists', 409);

    return sequelize.transaction(async (t) => {
      const product = await Product.create(data, { transaction: t });

      // Always create a stock record for the product
      await Stock.create(
        { productId: product.id, quantity: 0, reservedQuantity: 0 },
        { transaction: t }
      );

      return product;
    });
  }

//  Update product

  async update(id, data) {
    const product = await this.getById(id);

    // Check SKU uniqueness if being changed
    if (data.sku && data.sku !== product.sku) {
      const existing = await Product.findOne({
        where: { sku: data.sku, id: { [Op.ne]: id } }
      });
      if (existing) throw new AppError('SKU already exists', 409);
    }

    await product.update(data);
    return this.getById(id);
  }

  // Soft delete - deactivate product

  async delete(id) {
    const product = await this.getById(id);
    await product.update({ isActive: false });
    return { message: 'Product deactivated successfully' };
  }

//  Get low stock products (below reorder level)
 
  async getLowStock() {
    const products = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Stock, as: 'stock', required: true },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    return products.filter(
      (p) => p.stock && p.stock.quantity <= p.reorderLevel
    );
  }
}

module.exports = new ProductService();
