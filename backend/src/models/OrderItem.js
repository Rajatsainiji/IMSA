module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'orders', key: 'id' }
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' }
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: { min: { args: [1], msg: 'Quantity must be at least 1' } }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'Unit price cannot be negative' } }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    productSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Snapshot of product details at time of order'
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['productId'] }
    ]
  });

  OrderItem.associate = (db) => {
    OrderItem.belongsTo(db.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });
  };

  return OrderItem;
};
