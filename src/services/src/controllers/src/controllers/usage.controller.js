const usageService = require('../services/usage.service');
const billingService = require('../services/billing.service');
const logger = require('../utils/logger');

class UsageController {
  /**
   * Get current month usage
   * GET /api/usage/current
   */
  async getCurrentUsage(req, res, next) {
    try {
      const userId = req.user.id;

      // Get current month usage
      const usage = await usageService.getCurrentMonthUsage(userId);

      // Get billing status
      const billing = await billingService.getBillingStatus(userId);

      // Calculate remaining quota
      const remainingQuota = billingService.getRemainingQuota(
        billing.freeQuota,
        usage.eventCount
      );

      res.status(200).json({
        success: true,
        data: {
          currentMonth: {
            year: usage.year,
            month: usage.month,
            eventCount: usage.eventCount,
            estimatedCost: usage.estimatedCost
          },
          billing: {
            status: billing.status,
            freeQuota: billing.freeQuota,
            remainingQuota: remainingQuota,
            isActive: billing.isActive
          }
        }
      });
    } catch (error) {
      logger.error('Error in getCurrentUsage controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Get usage history
   * GET /api/usage/history
   */
  async getUsageHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 12;

      const history = await usageService.getUserUsageHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          history
        }
      });
    } catch (error) {
      logger.error('Error in getUsageHistory controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }
}

module.exports = new UsageController();
