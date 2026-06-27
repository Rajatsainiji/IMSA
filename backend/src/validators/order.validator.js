const { body, param } = require('express-validator');

const createOrderValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Customer name must be 2-150 characters'),

  body('customerEmail').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Invalid customer email'),

  body('customerPhone').optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 30 }).withMessage('Phone cannot exceed 30 characters'),

  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),

  body('items.*.productId').isInt({ min: 1 }).withMessage('Each item must have a valid product ID'),

  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),

  body('notes').optional().trim().isLength({ max: 1000 })
];

const cancelOrderValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

const updateStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('status').notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status value')
];

module.exports = { createOrderValidator, cancelOrderValidator, updateStatusValidator };
