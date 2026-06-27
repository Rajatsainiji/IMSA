const { Op } = require('sequelize');
const { Product, Stock, Order, OrderItem, StockHistory, sequelize } = require('../models');

class DashboardService {
  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      revenueData,
      recentOrders,
      recentMovements
    ] = await Promise.all([
      Product.count(),
      Product.count({ where: { isActive: true } }),
      // Low stock: quantity > 0 but <= reorderLevel
      Product.count({
        include: [{
          model: Stock,
          as: 'stock',
          where: { quantity: { [Op.gt]: 0 } },
          required: true
        }],
        where: {
          isActive: true,
          '$stock.quantity$': { [Op.lte]: sequelize.col('Product.reorderLevel') }
        }
      }),
      Product.count({
        include: [{
          model: Stock,
          as: 'stock',
          where: { quantity: 0 },
          required: true
        }],
        where: { isActive: true }
      }),
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: today } } }),
      Order.count({ where: { createdAt: { [Op.gte]: monthStart } } }),
      Order.count({ where: { status: 'pending' } }),
      Order.findOne({
        attributes: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('totalAmount')), 0), 'totalRevenue'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM',
            sequelize.literal(`CASE WHEN createdAt >= '${today.toISOString()}' THEN totalAmount ELSE 0 END`)
          ), 0), 'todayRevenue'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM',
            sequelize.literal(`CASE WHEN createdAt >= '${monthStart.toISOString()}' THEN totalAmount ELSE 0 END`)
          ), 0), 'monthRevenue']
        ],
        where: { status: { [Op.notIn]: ['cancelled'] } },
        raw: true
      }),
      Order.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'orderNumber', 'customerName', 'status', 'totalAmount', 'createdAt']
      }),
      StockHistory.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
      })
    ]);

    return {
      inventory: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisMonth: monthOrders,
        pending: pendingOrders
      },
      revenue: {
        total: parseFloat(revenueData?.totalRevenue || 0),
        today: parseFloat(revenueData?.todayRevenue || 0),
        thisMonth: parseFloat(revenueData?.monthRevenue || 0)
      },
      recentOrders,
      recentStockMovements: recentMovements
    };
  }

  async getTopProducts(limit = 10) {
    return OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'orderCount']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku'],
        required: true
      }],
      group: ['productId', 'product.id', 'product.name', 'product.sku'],
      order: [[sequelize.literal('totalSold'), 'DESC']],
      limit,
      raw: false
    });
  }
}

module.exports = new DashboardService();
