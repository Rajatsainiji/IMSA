'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      orderNumber: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customerName: { type: Sequelize.STRING(150), allowNull: false },
      customerEmail: { type: Sequelize.STRING(150), allowNull: true },
      customerPhone: { type: Sequelize.STRING(30), allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      totalAmount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
      notes: { type: Sequelize.TEXT, allowNull: true },
      cancelledAt: { type: Sequelize.DATE, allowNull: true },
      cancellationReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('orders', ['userId']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  }
};
