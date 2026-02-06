const storeService = require('../services/store.service');
const webhookService = require('../services/webhook.service');
const marketplaceVerification = require('../services/marketplaceVerification.service');
const logger = require('../utils/logger');

class WebhooksController {
  /**
   * Handle Shopify webhook
   * POST /webhooks/shopify/:storeId
   */
  async handleShopify(req, res, next) {
    try {
      const { storeId } = req.params;
      const hmacHeader = req.headers['x-shopify-hmac-sha256'];
      const rawBody = req.rawBody;
      const payload = req.body;

      // Get store
      const store = await storeService.getStoreById(storeId);

      if (!store) {
        logger.warn('Shopify webhook - store not found', { storeId });
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      if (store.marketplaceType !== 'SHOPIFY') {
        logger.warn('Shopify webhook - wrong marketplace type', {
          storeId,
          expected: 'SHOPIFY',
          actual: store.marketplaceType
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid marketplace type'
        });
      }

      // Verify signature
      const isValid = marketplaceVerification.verifyShopify(
        rawBody,
        hmacHeader,
        store.webhookSecret
      );

      if (!isValid) {
        logger.warn('Shopify webhook - invalid signature', { storeId });
        await webhookService.saveUnverifiedWebhook(storeId, 'SHOPIFY', payload);
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Process webhook
      const result = await webhookService.processWebhook({
        store,
        marketplaceType: 'SHOPIFY',
        payload,
        verified: true
      });

      if (!result.success) {
        return res.status(200).json({
          success: true,
          message: `Webhook received but not processed: ${result.reason}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Error handling Shopify webhook', { error: error.message });
      next(error);
    }
  }

  /**
   * Handle WooCommerce webhook
   * POST /webhooks/woocommerce/:storeId
   */
  async handleWooCommerce(req, res, next) {
    try {
      const { storeId } = req.params;
      const signatureHeader = req.headers['x-wc-webhook-signature'];
      const rawBody = req.rawBody;
      const payload = req.body;

      // Get store
      const store = await storeService.getStoreById(storeId);

      if (!store) {
        logger.warn('WooCommerce webhook - store not found', { storeId });
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      if (store.marketplaceType !== 'WOOCOMMERCE') {
        logger.warn('WooCommerce webhook - wrong marketplace type', {
          storeId,
          expected: 'WOOCOMMERCE',
          actual: store.marketplaceType
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid marketplace type'
        });
      }

      // Verify signature
      const isValid = marketplaceVerification.verifyWooCommerce(
        rawBody,
        signatureHeader,
        store.webhookSecret
      );

      if (!isValid) {
        logger.warn('WooCommerce webhook - invalid signature', { storeId });
        await webhookService.saveUnverifiedWebhook(storeId, 'WOOCOMMERCE', payload);
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Process webhook
      const result = await webhookService.processWebhook({
        store,
        marketplaceType: 'WOOCOMMERCE',
        payload,
        verified: true
      });

      if (!result.success) {
        return res.status(200).json({
          success: true,
          message: `Webhook received but not processed: ${result.reason}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Error handling WooCommerce webhook', { error: error.message });
      next(error);
    }
  }

  /**
   * Handle BigCommerce webhook
   * POST /webhooks/bigcommerce/:storeId
   */
  async handleBigCommerce(req, res, next) {
    try {
      const { storeId } = req.params;
      const signatureHeader = req.headers['x-bc-webhook-signature'];
      const rawBody = req.rawBody;
      const payload = req.body;

      // Get store
      const store = await storeService.getStoreById(storeId);

      if (!store) {
        logger.warn('BigCommerce webhook - store not found', { storeId });
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      if (store.marketplaceType !== 'BIGCOMMERCE') {
        logger.warn('BigCommerce webhook - wrong marketplace type', {
          storeId,
          expected: 'BIGCOMMERCE',
          actual: store.marketplaceType
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid marketplace type'
        });
      }

      // Verify signature
      const isValid = marketplaceVerification.verifyBigCommerce(
        rawBody,
        signatureHeader,
        store.webhookSecret
      );

      if (!isValid) {
        logger.warn('BigCommerce webhook - invalid signature', { storeId });
        await webhookService.saveUnverifiedWebhook(storeId, 'BIGCOMMERCE', payload);
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Process webhook
      const result = await webhookService.processWebhook({
        store,
        marketplaceType: 'BIGCOMMERCE',
        payload,
        verified: true
      });

      if (!result.success) {
        return res.status(200).json({
          success: true,
          message: `Webhook received but not processed: ${result.reason}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Error handling BigCommerce webhook', { error: error.message });
      next(error);
    }
  }

  /**
   * Handle Magento webhook
   * POST /webhooks/magento/:storeId
   */
  async handleMagento(req, res, next) {
    try {
      const { storeId } = req.params;
      const { secret } = req.query;
      const payload = req.body;

      // Get store
      const store = await storeService.getStoreById(storeId);

      if (!store) {
        logger.warn('Magento webhook - store not found', { storeId });
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      if (store.marketplaceType !== 'MAGENTO') {
        logger.warn('Magento webhook - wrong marketplace type', {
          storeId,
          expected: 'MAGENTO',
          actual: store.marketplaceType
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid marketplace type'
        });
      }

      // Verify secret
      const isValid = marketplaceVerification.verifyMagento(
        secret,
        store.webhookSecret
      );

      if (!isValid) {
        logger.warn('Magento webhook - invalid secret', { storeId });
        await webhookService.saveUnverifiedWebhook(storeId, 'MAGENTO', payload);
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook secret'
        });
      }

      // Process webhook
      const result = await webhookService.processWebhook({
        store,
        marketplaceType: 'MAGENTO',
        payload,
        verified: true
      });

      if (!result.success) {
        return res.status(200).json({
          success: true,
          message: `Webhook received but not processed: ${result.reason}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Error handling Magento webhook', { error: error.message });
      next(error);
    }
  }
}

module.exports = new WebhooksController();
