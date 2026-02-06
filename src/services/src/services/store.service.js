const prisma = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class StoreService {
  /**
   * Create a new store
   */
  async createStore(userId, { marketplaceType, storeName, storeUrl }) {
    try {
      // Generate webhook secret
      const webhookSecret = crypto.randomBytes(32).toString('hex');

      const store = await prisma.store.create({
        data: {
          userId,
          marketplaceType,
          storeName,
          storeUrl,
          webhookSecret,
          status: 'ACTIVE'
        }
      });

      logger.info('Store created', {
        storeId: store.id,
        userId,
        marketplaceType,
        storeName
      });

      return store;
    } catch (error) {
      logger.error('Error creating store', {
        userId,
        marketplaceType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId) {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true
            }
          }
        }
      });

      return store;
    } catch (error) {
      logger.error('Error getting store by ID', { storeId, error: error.message });
      throw error;
    }
  }

  /**
   * Get stores by user ID
   */
  async getStoresByUserId(userId) {
    try {
      const stores = await prisma.store.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return stores;
    } catch (error) {
      logger.error('Error getting stores by user ID', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find store by marketplace type and identifier
   */
  async findStoreByWebhookData(marketplaceType, storeIdentifier) {
    try {
      // Try to find store by URL or name
      const stores = await prisma.store.findMany({
        where: {
          marketplaceType,
          OR: [
            { storeUrl: { contains: storeIdentifier } },
            { storeName: storeIdentifier }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true
            }
          }
        }
      });

      return stores[0] || null;
    } catch (error) {
      logger.error('Error finding store by webhook data', {
        marketplaceType,
        storeIdentifier,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update store status
   */
  async updateStoreStatus(storeId, status) {
    try {
      const store = await prisma.store.update({
        where: { id: storeId },
        data: { status }
      });

      logger.info('Store status updated', { storeId, status });

      return store;
    } catch (error) {
      logger.error('Error updating store status', { storeId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Delete store
   */
  async deleteStore(storeId) {
    try {
      await prisma.store.delete({
        where: { id: storeId }
      });

      logger.info('Store deleted', { storeId });
    } catch (error) {
      logger.error('Error deleting store', { storeId, error: error.message });
      throw error;
    }
  }
}

module.exports = new StoreService();
