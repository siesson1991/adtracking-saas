const prisma = require('../config/database');
const logger = require('../utils/logger');
const usageService = require('./usage.service');
const marketplaceVerification = require('./marketplaceVerification.service');

class WebhookService {
  /**
   * Process incoming webhook
   */
  async processWebhook({ store, marketplaceType, payload, verified }) {
    try {
      // Extract order ID
      const orderId = marketplaceVerification.extractOrderId(marketplaceType, payload);

      // Check if order is paid
      const isPaid = marketplaceVerification.isOrderPaid(marketplaceType, payload);

      // Check if test event
      const isTest = marketplaceVerification.isTestEvent(marketplaceType, payload);

      // Validate conditions
      if (!isPaid) {
        logger.info('Webhook ignored - order not paid', {
          storeId: store.id,
          orderId,
          marketplaceType
        });
        return { success: false, reason: 'Order not paid' };
      }

      if (isTest) {
        logger.info('Webhook ignored - test event', {
          storeId: store.id,
          orderId,
          marketplaceType
        });
        return { success: false, reason: 'Test event' };
      }

      // Check store status
      if (store.status === 'DISABLED') {
        logger.warn('Webhook rejected - store disabled', {
          storeId: store.id,
          userId: store.userId
        });
        return { success: false, reason: 'Store disabled' };
      }

      // Check user status
      if (store.user.status === 'SUSPENDED') {
        logger.warn('Webhook rejected - user suspended', {
          storeId: store.id,
          userId: store.userId
        });
        return { success: false, reason: 'User suspended' };
      }

      // Check for duplicate (idempotency)
      if (orderId) {
        const existingEvent = await prisma.trackedEvent.findFirst({
          where: {
            userId: store.userId,
            orderId: orderId,
            source: marketplaceType
          }
        });

        if (existingEvent) {
          logger.info('Webhook ignored - duplicate order', {
            storeId: store.id,
            orderId,
            marketplaceType
          });
          return { success: false, reason: 'Duplicate order' };
        }
      }

      // Process webhook in transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Save webhook event
        const webhookEvent = await tx.webhookEvent.create({
          data: {
            storeId: store.id,
            marketplaceType,
            rawPayload: payload,
            verified,
            processed: true,
            orderId
          }
        });

        // 2. Create tracked event
        const trackedEvent = await tx.trackedEvent.create({
          data: {
            userId: store.userId,
            source: marketplaceType,
            eventType: 'order_created',
            orderId
          }
        });

        // 3. Increment usage
        const { year, month } = usageService.getCurrentPeriod();

        let counter = await tx.usageCounter.findUnique({
          where: {
            userId_year_month: {
              userId: store.userId,
              year,
              month
            }
          }
        });

        if (!counter) {
          counter = await tx.usageCounter.create({
            data: {
              userId: store.userId,
              year,
              month,
              eventCount: 0,
              estimatedCost: 0
            }
          });
        }

        const newEventCount = counter.eventCount + 1;
        const newEstimatedCost = newEventCount * usageService.constructor.COST_PER_EVENT;

        const updatedCounter = await tx.usageCounter.update({
          where: {
            userId_year_month: {
              userId: store.userId,
              year,
              month
            }
          },
          data: {
            eventCount: newEventCount,
            estimatedCost: newEstimatedCost
          }
        });

        return { webhookEvent, trackedEvent, usageCounter: updatedCounter };
      });

      logger.info('Webhook processed successfully', {
        storeId: store.id,
        userId: store.userId,
        orderId,
        marketplaceType,
        webhookEventId: result.webhookEvent.id,
        trackedEventId: result.trackedEvent.id,
        newUsage: result.usageCounter.eventCount
      });

      return {
        success: true,
        data: {
          webhookEventId: result.webhookEvent.id,
          trackedEventId: result.trackedEvent.id,
          usage: {
            eventCount: result.usageCounter.eventCount,
            estimatedCost: parseFloat(result.usageCounter.estimatedCost)
          }
        }
      };
    } catch (error) {
      logger.error('Error processing webhook', {
        storeId: store?.id,
        marketplaceType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save unverified webhook for debugging
   */
  async saveUnverifiedWebhook(storeId, marketplaceType, payload) {
    try {
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          storeId,
          marketplaceType,
          rawPayload: payload,
          verified: false,
          processed: false
        }
      });

      logger.warn('Unverified webhook saved', {
        storeId,
        marketplaceType,
        webhookEventId: webhookEvent.id
      });

      return webhookEvent;
    } catch (error) {
      logger.error('Error saving unverified webhook', {
        storeId,
        marketplaceType,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new WebhookService();
