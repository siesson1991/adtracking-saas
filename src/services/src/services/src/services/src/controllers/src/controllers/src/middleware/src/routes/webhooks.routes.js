const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooks.controller');

// Webhook endpoints (no authentication required - verified by signature)
router.post('/shopify/:storeId', webhooksController.handleShopify);
router.post('/woocommerce/:storeId', webhooksController.handleWooCommerce);
router.post('/bigcommerce/:storeId', webhooksController.handleBigCommerce);
router.post('/magento/:storeId', webhooksController.handleMagento);

module.exports = router;
