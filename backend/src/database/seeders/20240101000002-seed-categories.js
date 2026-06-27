'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categories', [
      { name: 'Electronics', description: 'Electronic devices and accessories', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Office Supplies', description: 'Stationery and office equipment', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Furniture', description: 'Office and home furniture', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Clothing', description: 'Apparel and accessories', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Food & Beverages', description: 'Consumable food and drink items', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
