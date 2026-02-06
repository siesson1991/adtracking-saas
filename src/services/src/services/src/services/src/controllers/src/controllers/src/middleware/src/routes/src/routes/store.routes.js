const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const storeController = require('../controllers/store.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createStoreValidation = [
  body('marketplaceType')
    .isIn(['SHOPIFY', 'WOOCOMMERCE', 'BIGCOMMERCE', 'MAGENTO'])
    .withMessage('Invalid marketplace type'),
  body('storeName')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters'),
  body('storeUrl')
    .trim()
    .notEmpty()
    .withMessage('Store URL is required')
    .isURL()
    .withMessage('Invalid store URL')
];

const updateStoreStatusValidation = [
  body('status')
    .isIn(['ACTIVE', 'DISABLED'])
    .withMessage('Invalid status')
];

// Routes
router.post('/', authMiddleware, createStoreValidation, validate, storeController.createStore);
router.get('/', authMiddleware, storeController.getStores);
router.get('/:id', authMiddleware, storeController.getStore);
router.patch('/:id/status', authMiddleware, updateStoreStatusValidation, validate, storeController.updateStoreStatus);
router.delete('/:id', authMiddleware, storeController.deleteStore);

module.exports = router;
