'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      sku: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      categoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      unit: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'pcs' },
      costPrice: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
      sellingPrice: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
      reorderLevel: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 10 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      imageUrl: { type: Sequelize.STRING(500), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('products', ['categoryId']);
    await queryInterface.addIndex('products', ['isActive']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
