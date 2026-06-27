const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim()
];

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', param('id').isInt({ min: 1 }), validate, categoryController.getById);
router.post('/', authorize('admin', 'manager'), categoryValidator, validate, categoryController.create);
router.put('/:id', authorize('admin', 'manager'), categoryValidator, validate, categoryController.update);
router.delete('/:id', authorize('admin'), param('id').isInt({ min: 1 }), validate, categoryController.delete);

module.exports = router;
