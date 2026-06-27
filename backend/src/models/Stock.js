module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define('Stock', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: 'products', key: 'id' }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Stock quantity cannot be negative' }
      }
    },
    reservedQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity reserved by pending orders'
    },
    lastRestockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'stocks',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['productId'] }
    ]
  });

  // Virtual field for available quantity
  Stock.prototype.getAvailableQuantity = function () {
    return this.quantity - this.reservedQuantity;
  };

  Stock.associate = (db) => {
    Stock.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });
  };

  return Stock;
};
