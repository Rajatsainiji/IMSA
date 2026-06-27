'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('products', [
      { name: 'Laptop Pro 15"', sku: 'ELEC-LAP-001', description: 'High performance laptop', categoryId: 1, unit: 'pcs', costPrice: 800.00, sellingPrice: 1200.00, reorderLevel: 5, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Wireless Mouse', sku: 'ELEC-MOU-001', description: 'Ergonomic wireless mouse', categoryId: 1, unit: 'pcs', costPrice: 15.00, sellingPrice: 29.99, reorderLevel: 20, isActive: true, createdAt: now, updatedAt: now },
      { name: 'USB-C Hub', sku: 'ELEC-HUB-001', description: '7-in-1 USB-C Hub', categoryId: 1, unit: 'pcs', costPrice: 25.00, sellingPrice: 49.99, reorderLevel: 15, isActive: true, createdAt: now, updatedAt: now },
      { name: 'A4 Paper Ream', sku: 'OFF-PAP-001', description: '500 sheets A4 printing paper', categoryId: 2, unit: 'ream', costPrice: 3.50, sellingPrice: 7.99, reorderLevel: 50, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Ballpoint Pen Box', sku: 'OFF-PEN-001', description: 'Box of 50 blue ballpoint pens', categoryId: 2, unit: 'box', costPrice: 4.00, sellingPrice: 8.99, reorderLevel: 30, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Office Chair', sku: 'FURN-CHR-001', description: 'Ergonomic office chair with lumbar support', categoryId: 3, unit: 'pcs', costPrice: 150.00, sellingPrice: 299.00, reorderLevel: 3, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Standing Desk', sku: 'FURN-DSK-001', description: 'Height-adjustable standing desk', categoryId: 3, unit: 'pcs', costPrice: 300.00, sellingPrice: 599.00, reorderLevel: 2, isActive: true, createdAt: now, updatedAt: now }
    ]);

    // Seed initial stocks
    await queryInterface.bulkInsert('stocks', [
      { productId: 1, quantity: 25, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 2, quantity: 100, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 3, quantity: 60, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 4, quantity: 200, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 5, quantity: 150, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 6, quantity: 15, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now },
      { productId: 7, quantity: 8, reservedQuantity: 0, lastRestockedAt: now, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stocks', null, {});
    await queryInterface.bulkDelete('products', null, {});
  }
};
