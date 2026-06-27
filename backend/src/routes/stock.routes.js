const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  addStockValidator,
  removeStockValidator,
  adjustStockValidator
} = require('../validators/stock.validator');

router.use(authenticate);

// System-wide stock history
router.get('/history', stockController.getAllHistory);

// Per-product stock operations
router.get('/product/:productId', stockController.getByProduct);
router.get('/product/:productId/history', stockController.getHistory);
router.post('/product/:productId/add', authorize('admin', 'manager'), addStockValidator, validate, stockController.addStock);
router.post('/product/:productId/remove', authorize('admin', 'manager'), removeStockValidator, validate, stockController.removeStock);
router.put('/product/:productId/adjust', authorize('admin'), adjustStockValidator, validate, stockController.adjustStock);

module.exports = router;
