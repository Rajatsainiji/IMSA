const { Stock, Product, StockHistory, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class StockService {

  // Get stock for a product

  async getByProductId(productId) {
    const stock = await Stock.findOne({
      where: { productId },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'reorderLevel'] }]
    });
    if (!stock) throw new AppError('Stock record not found', 404);
    return stock;
  }

// Add stock (stock_in) - uses database transaction

  async addStock({ productId, quantity, notes, userId }) {
    if (quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);

    return sequelize.transaction(async (t) => {
      // Lock the row for update
      const stock = await Stock.findOne({
        where: { productId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!stock) throw new AppError('Stock record not found for this product', 404);

      const quantityBefore = stock.quantity;
      const quantityAfter = quantityBefore + quantity;

      await stock.update(
        { quantity: quantityAfter, lastRestockedAt: new Date() },
        { transaction: t }
      );

      await StockHistory.create({
        productId,
        userId,
        movementType: 'stock_in',
        quantityBefore,
        quantityChanged: quantity,
        quantityAfter,
        notes: notes || 'Stock added'
      }, { transaction: t });

      logger.info(`Stock added: Product ${productId}, +${quantity}, New total: ${quantityAfter}`);

      return stock;
    });
  }

// Remove stock (stock_out) - uses database transaction

  async removeStock({ productId, quantity, notes, userId }) {
    if (quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);

    return sequelize.transaction(async (t) => {
      const stock = await Stock.findOne({
        where: { productId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!stock) throw new AppError('Stock record not found', 404);

      if (stock.quantity < quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${stock.quantity}, Requested: ${quantity}`,
          400
        );
      }

      const quantityBefore = stock.quantity;
      const quantityAfter = quantityBefore - quantity;

      await stock.update({ quantity: quantityAfter }, { transaction: t });

      await StockHistory.create({
        productId,
        userId,
        movementType: 'stock_out',
        quantityBefore,
        quantityChanged: -quantity,
        quantityAfter,
        notes: notes || 'Stock removed'
      }, { transaction: t });

      logger.info(`Stock removed: Product ${productId}, -${quantity}, New total: ${quantityAfter}`);

      return stock;
    });
  }

// Adjust stock to a specific quantity

  async adjustStock({ productId, newQuantity, notes, userId }) {
    if (newQuantity < 0) throw new AppError('Quantity cannot be negative', 400);

    return sequelize.transaction(async (t) => {
      const stock = await Stock.findOne({
        where: { productId },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!stock) throw new AppError('Stock record not found', 404);

      const quantityBefore = stock.quantity;
      const quantityChanged = newQuantity - quantityBefore;

      if (quantityChanged === 0) {
        throw new AppError('New quantity is the same as current quantity', 400);
      }

      await stock.update({ quantity: newQuantity }, { transaction: t });

      await StockHistory.create({
        productId,
        userId,
        movementType: 'adjustment',
        quantityBefore,
        quantityChanged,
        quantityAfter: newQuantity,
        notes: notes || 'Manual stock adjustment'
      }, { transaction: t });

      return stock;
    });
  }

// Internal: Deduct stock when order is placed (called within existing transaction)

  async deductForOrder({ productId, quantity, orderId, orderNumber, transaction }) {
    const stock = await Stock.findOne({
      where: { productId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!stock) throw new AppError(`Stock not found for product ${productId}`, 404);

    if (stock.quantity < quantity) {
      throw new AppError(
        `Insufficient stock for product ID ${productId}. Available: ${stock.quantity}, Required: ${quantity}`,
        400
      );
    }

    const quantityBefore = stock.quantity;
    const quantityAfter = quantityBefore - quantity;

    await stock.update({ quantity: quantityAfter }, { transaction });

    await StockHistory.create({
      productId,
      orderId,
      movementType: 'order_deduction',
      quantityBefore,
      quantityChanged: -quantity,
      quantityAfter,
      referenceNumber: orderNumber,
      notes: `Stock deducted for order ${orderNumber}`
    }, { transaction });

    return stock;
  }

// Internal: Restore stock when order is cancelled (called within existing transaction)

  async restoreForCancellation({ productId, quantity, orderId, orderNumber, userId, transaction }) {
    const stock = await Stock.findOne({
      where: { productId },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!stock) throw new AppError(`Stock not found for product ${productId}`, 404);

    const quantityBefore = stock.quantity;
    const quantityAfter = quantityBefore + quantity;

    await stock.update({ quantity: quantityAfter }, { transaction });

    await StockHistory.create({
      productId,
      userId,
      orderId,
      movementType: 'order_return',
      quantityBefore,
      quantityChanged: quantity,
      quantityAfter,
      referenceNumber: orderNumber,
      notes: `Stock restored from cancelled order ${orderNumber}`
    }, { transaction });

    return stock;
  }

// Get stock history for a product with pagination

  async getHistory({ productId, page = 1, limit = 20, movementType }) {
    const where = { productId };
    if (movementType) where.movementType = movementType;

    const { count, rows } = await StockHistory.findAndCountAll({
      where,
      include: [
        { model: require('../models').User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: require('../models').Order, as: 'order', attributes: ['id', 'orderNumber', 'status'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return { histories: rows, total: count, page, limit };
  }

//  Get all stock history (system-wide)

  async getAllHistory({ page = 1, limit = 20, movementType, productId }) {
    const where = {};
    if (movementType) where.movementType = movementType;
    if (productId) where.productId = productId;

    const { count, rows } = await StockHistory.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: require('../models').User, as: 'user', attributes: ['id', 'name'] },
        { model: require('../models').Order, as: 'order', attributes: ['id', 'orderNumber'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return { histories: rows, total: count, page, limit };
  }
}

module.exports = new StockService();
