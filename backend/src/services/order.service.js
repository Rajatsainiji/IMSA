const { Op } = require('sequelize');
const { Order, OrderItem, Product, Stock, User, sequelize } = require('../models');
const stockService = require('./stock.service');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Generate unique order number: ORD-YYYYMMDD-XXXXX

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${date}-${random}`;
};

// Statuses that are considered "active" (stock already deducted)
const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

class OrderService {

  // Get all orders with pagination and filtering

  async getAll({ page = 1, limit = 10, status, search, userId, startDate, endDate }) {
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerEmail: { [Op.like]: `%${search}%` } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });

    return { orders: rows, total: count, page, limit };
  }

//  Get order by ID

  async getById(id) {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] }]
        }
      ]
    });
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

// Place a new order - deducts stock atomically

  async create({ items, customerName, customerEmail, customerPhone, notes, userId }) {
    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    return sequelize.transaction(async (t) => {
      const orderNumber = generateOrderNumber();
      let totalAmount = 0;
      const orderItemsData = [];

      // Validate all products and stock upfront before any deduction
      for (const item of items) {
        const product = await Product.findOne({
          where: { id: item.productId, isActive: true },
          transaction: t
        });
        if (!product) {
          throw new AppError(`Product with ID ${item.productId} not found or inactive`, 404);
        }

        const stock = await Stock.findOne({
          where: { productId: item.productId },
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`,
            400
          );
        }

        const unitPrice = parseFloat(product.sellingPrice);
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        orderItemsData.push({
          product,
          stock,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          productSnapshot: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            sellingPrice: product.sellingPrice
          }
        });
      }

      // Create the order
      const order = await Order.create({
        orderNumber,
        userId,
        customerName,
        customerEmail,
        customerPhone,
        status: 'pending',
        totalAmount,
        notes
      }, { transaction: t });

      // Create order items and deduct stock
      for (const itemData of orderItemsData) {
        await OrderItem.create({
          orderId: order.id,
          productId: itemData.product.id,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          productSnapshot: itemData.productSnapshot
        }, { transaction: t });

        // Deduct stock and log history
        await stockService.deductForOrder({
          productId: itemData.product.id,
          quantity: itemData.quantity,
          orderId: order.id,
          orderNumber,
          transaction: t
        });
      }

      logger.info(`Order created: ${orderNumber} by user ${userId}, Total: ${totalAmount}`);

      return this._getOrderWithinTransaction(order.id, t);
    });
  }

//  Update order status

  async updateStatus(id, status, userId) {
    const order = await this.getById(id);

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new AppError(
        `Cannot transition from '${order.status}' to '${status}'`,
        400
      );
    }

    if (status === 'cancelled') {
      return this.cancel(id, userId, 'Status updated to cancelled');
    }

    await order.update({ status });
    return this.getById(id);
  }

  // Cancel order and restore stock

  async cancel(id, userId, reason = '') {
    const order = await this.getById(id);

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new AppError(
        `Cannot cancel order with status '${order.status}'. Only ${CANCELLABLE_STATUSES.join(', ')} orders can be cancelled.`,
        400
      );
    }

    return sequelize.transaction(async (t) => {
      // Restore stock for each item
      for (const item of order.items) {
        await stockService.restoreForCancellation({
          productId: item.productId,
          quantity: item.quantity,
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId,
          transaction: t
        });
      }

      await order.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      }, { transaction: t });

      logger.info(`Order cancelled: ${order.orderNumber} by user ${userId}`);

      return this._getOrderWithinTransaction(order.id, t);
    });
  }

// Get order within an existing transaction

  async _getOrderWithinTransaction(id, t) {
    return Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ],
      transaction: t
    });
  }

//  Get order statistics

  async getStats() {
    const [statusCounts, revenueData] = await Promise.all([
      Order.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      }),
      Order.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders']
        ],
        where: { status: { [Op.ne]: 'cancelled' } },
        raw: true
      })
    ]);

    return { statusCounts, ...revenueData };
  }
}

module.exports = new OrderService();
