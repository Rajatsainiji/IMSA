module.exports = (sequelize, DataTypes) => {
  const StockHistory = sequelize.define('StockHistory', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'orders', key: 'id' }
    },
    movementType: {
      type: DataTypes.ENUM(
        'stock_in',        // Stock added manually
        'stock_out',       // Stock removed manually
        'order_deduction', // Stock deducted due to order
        'order_return',    // Stock returned due to cancellation
        'adjustment',      // Manual inventory adjustment
        'initial'          // Initial stock setup
      ),
      allowNull: false
    },
    quantityBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stock quantity before this movement'
    },
    quantityChanged: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Positive = increase, Negative = decrease'
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stock quantity after this movement'
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Order number or other reference'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'stock_histories',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['productId'] },
      { fields: ['userId'] },
      { fields: ['orderId'] },
      { fields: ['movementType'] },
      { fields: ['createdAt'] }
    ]
  });

  StockHistory.associate = (db) => {
    StockHistory.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });
    StockHistory.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
    StockHistory.belongsTo(db.Order, { foreignKey: 'orderId', as: 'order' });
  };

  return StockHistory;
};
