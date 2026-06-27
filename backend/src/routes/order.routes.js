const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createOrderValidator,
  cancelOrderValidator,
  updateStatusValidator
} = require('../validators/order.validator');

router.use(authenticate);

router.get('/', orderController.getAll);
router.get('/stats', orderController.getStats);
router.get('/:id', orderController.getById);
router.post('/', createOrderValidator, validate, orderController.create);
router.put('/:id/status', authorize('admin', 'manager'), updateStatusValidator, validate, orderController.updateStatus);
router.put('/:id/cancel', cancelOrderValidator, validate, orderController.cancel);

module.exports = router;
