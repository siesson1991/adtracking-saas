const prisma = require('../config/database');
const logger = require('../utils/logger');

class BillingService {
  /**
   * Get or create billing account for user
   */
  async getOrCreateBillingAccount(userId) {
    try {
      let billingAccount = await prisma.billingAccount.findUnique({
        where: { userId }
      });

      if (!billingAccount) {
        billingAccount = await prisma.billingAccount.create({
          data: {
            userId,
            status: 'ACTIVE',
            freeQuota: 100
          }
        });
        
        logger.info('Billing account created', { userId, freeQuota: 100 });
      }

      return billingAccount;
    } catch (error) {
      logger.error('Error getting/creating billing account', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Check if user can track events
   * Returns { canTrack: boolean, reason: string | null }
   */
  async canTrackEvent(userId, currentMonthUsage) {
    try {
      const billingAccount = await this.getOrCreateBillingAccount(userId);

      // Inactive billing accounts can only use free quota
      if (billingAccount.status === 'INACTIVE') {
        if (currentMonthUsage >= billingAccount.freeQuota) {
          logger.warn('Free quota exceeded for inactive billing account', {
            userId,
            usage: currentMonthUsage,
            quota: billingAccount.freeQuota
          });
          return {
            canTrack: false,
            reason: 'Free quota exceeded. Please activate your billing account.'
          };
        }
      }

      // Active accounts can track indefinitely (billing will be handled later)
      return { canTrack: true, reason: null };
    } catch (error) {
      logger.error('Error checking tracking eligibility', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get billing status for user
   */
  async getBillingStatus(userId) {
    try {
      const billingAccount = await this.getOrCreateBillingAccount(userId);
      
      return {
        status: billingAccount.status,
        freeQuota: billingAccount.freeQuota,
        isActive: billingAccount.status === 'ACTIVE'
      };
    } catch (error) {
      logger.error('Error getting billing status', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Calculate remaining free quota
   */
  getRemainingQuota(freeQuota, currentUsage) {
    const remaining = freeQuota - currentUsage;
    return remaining > 0 ? remaining : 0;
  }
}

module.exports = new BillingService();
