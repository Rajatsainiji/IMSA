const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator
} = require('../validators/product.validator');

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/low-stock', productController.getLowStock);
router.get('/:id', productIdValidator, validate, productController.getById);
router.post('/', authorize('admin', 'manager'), createProductValidator, validate, productController.create);
router.put('/:id', authorize('admin', 'manager'), updateProductValidator, validate, productController.update);
router.delete('/:id', authorize('admin'), productIdValidator, validate, productController.delete);

module.exports = router;
