const { body, param, query } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),

  body('sku').trim().notEmpty().withMessage('SKU is required')
    .matches(/^[A-Z0-9\-_]+$/i).withMessage('SKU can only contain letters, numbers, hyphens, underscores')
    .isLength({ max: 100 }).withMessage('SKU cannot exceed 100 characters'),

  body('categoryId').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),

  body('unit').optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Unit cannot exceed 50 characters'),

  body('costPrice').optional()
    .isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),

  body('sellingPrice').optional()
    .isFloat({ min: 0 }).withMessage('Selling price must be a non-negative number'),

  body('reorderLevel').optional()
    .isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer'),

  body('description').optional().trim()
];

const updateProductValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID'),
  ...createProductValidator.map((v) => v.optional ? v : v)
];

const productIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID')
];

module.exports = { createProductValidator, updateProductValidator, productIdValidator };
