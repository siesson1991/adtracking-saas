const storeService = require('../services/store.service');
const logger = require('../utils/logger');

class StoreController {
  /**
   * Create a new store
   * POST /api/stores
   */
  async createStore(req, res, next) {
    try {
      const userId = req.user.id;
      const { marketplaceType, storeName, storeUrl } = req.body;

      const store = await storeService.createStore(userId, {
        marketplaceType,
        storeName,
        storeUrl
      });

      res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: {
          store: {
            id: store.id,
            marketplaceType: store.marketplaceType,
            storeName: store.storeName,
            storeUrl: store.storeUrl,
            status: store.status,
            webhookSecret: store.webhookSecret,
            webhookUrl: this.generateWebhookUrl(req, store),
            createdAt: store.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error in createStore controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Get user's stores
   * GET /api/stores
   */
  async getStores(req, res, next) {
    try {
      const userId = req.user.id;

      const stores = await storeService.getStoresByUserId(userId);

      const storesWithWebhookUrls = stores.map(store => ({
        id: store.id,
        marketplaceType: store.marketplaceType,
        storeName: store.storeName,
        storeUrl: store.storeUrl,
        status: store.status,
        webhookSecret: store.webhookSecret,
        webhookUrl: this.generateWebhookUrl(req, store),
        createdAt: store.createdAt
      }));

      res.status(200).json({
        success: true,
        data: {
          stores: storesWithWebhookUrls
        }
      });
    } catch (error) {
      logger.error('Error in getStores controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Get store by ID
   * GET /api/stores/:id
   */
  async getStore(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check ownership
      if (store.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          store: {
            id: store.id,
            marketplaceType: store.marketplaceType,
            storeName: store.storeName,
            storeUrl: store.storeUrl,
            status: store.status,
            webhookSecret: store.webhookSecret,
            webhookUrl: this.generateWebhookUrl(req, store),
            createdAt: store.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error in getStore controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Update store status
   * PATCH /api/stores/:id/status
   */
  async updateStoreStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check ownership
      if (store.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedStore = await storeService.updateStoreStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Store status updated',
        data: {
          store: {
            id: updatedStore.id,
            status: updatedStore.status
          }
        }
      });
    } catch (error) {
      logger.error('Error in updateStoreStatus controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Delete store
   * DELETE /api/stores/:id
   */
  async deleteStore(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const store = await storeService.getStoreById(id);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check ownership
      if (store.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await storeService.deleteStore(id);

      res.status(200).json({
        success: true,
        message: 'Store deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteStore controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Generate webhook URL based on marketplace type
   */
  generateWebhookUrl(req, store) {
    const protocol = req.protocol;
    const host = req.get('host');
    const marketplace = store.marketplaceType.toLowerCase();
    
    return `${protocol}://${host}/webhooks/${marketplace}/${store.id}`;
  }
}

module.exports = new StoreController();
