'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const staffPassword = await bcrypt.hash('Staff@123', 12);

    await queryInterface.bulkInsert('users', [
      {
        name: 'System Admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Store Manager',
        email: 'manager@inventory.com',
        password: hashedPassword,
        role: 'manager',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Staff User',
        email: 'staff@inventory.com',
        password: staffPassword,
        role: 'staff',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
