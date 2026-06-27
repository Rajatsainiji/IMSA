'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_histories', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      orderId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      movementType: {
        type: Sequelize.ENUM('stock_in', 'stock_out', 'order_deduction', 'order_return', 'adjustment', 'initial'),
        allowNull: false
      },
      quantityBefore: { type: Sequelize.INTEGER, allowNull: false },
      quantityChanged: { type: Sequelize.INTEGER, allowNull: false },
      quantityAfter: { type: Sequelize.INTEGER, allowNull: false },
      referenceNumber: { type: Sequelize.STRING(100), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('stock_histories', ['productId']);
    await queryInterface.addIndex('stock_histories', ['userId']);
    await queryInterface.addIndex('stock_histories', ['orderId']);
    await queryInterface.addIndex('stock_histories', ['movementType']);
    await queryInterface.addIndex('stock_histories', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_histories');
  }
};
