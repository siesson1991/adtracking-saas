const crypto = require('crypto');
const logger = require('../utils/logger');

class MarketplaceVerificationService {
  /**
   * Verify Shopify webhook signature
   * Uses HMAC SHA256
   */
  verifyShopify(rawBody, hmacHeader, secret) {
    try {
      if (!hmacHeader || !secret) {
        logger.warn('Missing Shopify HMAC header or secret');
        return false;
      }

      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(hmacHeader)
      );

      if (!isValid) {
        logger.warn('Shopify webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying Shopify webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Verify WooCommerce webhook signature
   * Uses shared webhook secret
   */
  verifyWooCommerce(rawBody, signatureHeader, secret) {
    try {
      if (!signatureHeader || !secret) {
        logger.warn('Missing WooCommerce signature header or secret');
        return false;
      }

      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(signatureHeader)
      );

      if (!isValid) {
        logger.warn('WooCommerce webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying WooCommerce webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Verify BigCommerce webhook signature
   * Uses HMAC signature header
   */
  verifyBigCommerce(rawBody, signatureHeader, secret) {
    try {
      if (!signatureHeader || !secret) {
        logger.warn('Missing BigCommerce signature header or secret');
        return false;
      }

      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(signatureHeader)
      );

      if (!isValid) {
        logger.warn('BigCommerce webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying BigCommerce webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Verify Magento webhook signature
   * Uses shared secret token
   */
  verifyMagento(secretParam, expectedSecret) {
    try {
      if (!secretParam || !expectedSecret) {
        logger.warn('Missing Magento secret parameter');
        return false;
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(secretParam),
        Buffer.from(expectedSecret)
      );

      if (!isValid) {
        logger.warn('Magento webhook secret verification failed');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying Magento webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Extract order ID from webhook payload
   */
  extractOrderId(marketplace, payload) {
    try {
      switch (marketplace) {
        case 'SHOPIFY':
          return payload.id?.toString() || payload.order_number?.toString() || null;
        
        case 'WOOCOMMERCE':
          return payload.id?.toString() || payload.order_key || null;
        
        case 'BIGCOMMERCE':
          return payload.data?.id?.toString() || payload.order_id?.toString() || null;
        
        case 'MAGENTO':
          return payload.entity_id?.toString() || payload.increment_id || null;
        
        default:
          return null;
      }
    } catch (error) {
      logger.error('Error extracting order ID', { marketplace, error: error.message });
      return null;
    }
  }

  /**
   * Check if order is paid/completed
   */
  isOrderPaid(marketplace, payload) {
    try {
      switch (marketplace) {
        case 'SHOPIFY':
          return payload.financial_status === 'paid' || payload.financial_status === 'authorized';
        
        case 'WOOCOMMERCE':
          return payload.status === 'completed' || payload.status === 'processing';
        
        case 'BIGCOMMERCE':
          return payload.data?.status === 'Completed' || payload.data?.status === 'Shipped';
        
        case 'MAGENTO':
          return payload.state === 'complete' || payload.state === 'processing';
        
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking order payment status', { marketplace, error: error.message });
      return false;
    }
  }

  /**
   * Check if webhook is a test event
   */
  isTestEvent(marketplace, payload) {
    try {
      switch (marketplace) {
        case 'SHOPIFY':
          return payload.test === true || payload.name?.includes('test');
        
        case 'WOOCOMMERCE':
          return payload.customer_note?.toLowerCase().includes('test');
        
        case 'BIGCOMMERCE':
          return payload.data?.customer_message?.toLowerCase().includes('test');
        
        case 'MAGENTO':
          return payload.customer_note?.toLowerCase().includes('test');
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

module.exports = new MarketplaceVerificationService();
