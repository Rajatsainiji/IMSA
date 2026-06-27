module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
        len: { args: [2, 200], msg: 'Name must be between 2 and 200 characters' }
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'SKU already exists' },
      validate: {
        notEmpty: { msg: 'SKU is required' },
        is: { args: /^[A-Z0-9\-_]+$/i, msg: 'SKU can only contain letters, numbers, hyphens, and underscores' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'categories', key: 'id' }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pcs',
      validate: { notEmpty: { msg: 'Unit is required' } }
    },
    costPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: { min: { args: [0], msg: 'Cost price cannot be negative' } }
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: { min: { args: [0], msg: 'Selling price cannot be negative' } }
    },
    reorderLevel: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10,
      validate: { min: { args: [0], msg: 'Reorder level cannot be negative' } }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['sku'] },
      { fields: ['categoryId'] },
      { fields: ['isActive'] }
    ]
  });

  Product.associate = (db) => {
    Product.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category' });
    Product.hasOne(db.Stock, { foreignKey: 'productId', as: 'stock' });
    Product.hasMany(db.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
    Product.hasMany(db.StockHistory, { foreignKey: 'productId', as: 'stockHistories' });
  };

  return Product;
};
