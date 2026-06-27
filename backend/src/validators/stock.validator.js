const { body, param } = require('express-validator');

const addStockValidator = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const removeStockValidator = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('notes').optional().trim().isLength({ max: 500 })
];

const adjustStockValidator = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('newQuantity').isInt({ min: 0 }).withMessage('New quantity must be a non-negative integer'),
  body('notes').optional().trim().isLength({ max: 500 })
];

module.exports = { addStockValidator, removeStockValidator, adjustStockValidator };
