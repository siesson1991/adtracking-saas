const prisma = require('../config/database');
const logger = require('../utils/logger');

class UsageService {
  // Cost per event in dollars
  static COST_PER_EVENT = 0.005;

  /**
   * Get current month and year
   */
  getCurrentPeriod() {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1 // JavaScript months are 0-indexed
    };
  }

  /**
   * Get or create usage counter for current month
   */
  async getOrCreateUsageCounter(userId, year, month) {
    try {
      let usageCounter = await prisma.usageCounter.findUnique({
        where: {
          userId_year_month: {
            userId,
            year,
            month
          }
        }
      });

      if (!usageCounter) {
        usageCounter = await prisma.usageCounter.create({
          data: {
            userId,
            year,
            month,
            eventCount: 0,
            estimatedCost: 0
          }
        });

        logger.info('Usage counter created', { userId, year, month });
      }

      return usageCounter;
    } catch (error) {
      logger.error('Error getting/creating usage counter', {
        userId,
        year,
        month,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Increment usage counter atomically
   * This is concurrency-safe using Prisma transactions
   */
  async incrementUsage(userId) {
    const { year, month } = this.getCurrentPeriod();

    try {
      // Use transaction to ensure atomicity
      const updatedCounter = await prisma.$transaction(async (tx) => {
        // Get or create counter
        let counter = await tx.usageCounter.findUnique({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          }
        });

        if (!counter) {
          counter = await tx.usageCounter.create({
            data: {
              userId,
              year,
              month,
              eventCount: 0,
              estimatedCost: 0
            }
          });
        }

        // Increment event count
        const newEventCount = counter.eventCount + 1;
        const newEstimatedCost = newEventCount * UsageService.COST_PER_EVENT;

        // Update counter
        const updated = await tx.usageCounter.update({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          },
          data: {
            eventCount: newEventCount,
            estimatedCost: newEstimatedCost
          }
        });

        return updated;
      });

      logger.info('Usage incremented', {
        userId,
        year,
        month,
        newCount: updatedCounter.eventCount,
        newCost: updatedCounter.estimatedCost
      });

      return updatedCounter;
    } catch (error) {
      logger.error('Error incrementing usage', {
        userId,
        year,
        month,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track an event
   */
  async trackEvent(userId, source, eventType) {
    try {
      // Create tracked event and increment usage in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the tracked event
        const trackedEvent = await tx.trackedEvent.create({
          data: {
            userId,
            source,
            eventType
          }
        });

        // Get current period
        const { year, month } = this.getCurrentPeriod();

        // Get or create usage counter
        let counter = await tx.usageCounter.findUnique({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          }
        });

        if (!counter) {
          counter = await tx.usageCounter.create({
            data: {
              userId,
              year,
              month,
              eventCount: 0,
              estimatedCost: 0
            }
          });
        }

        // Increment usage
        const newEventCount = counter.eventCount + 1;
        const newEstimatedCost = newEventCount * UsageService.COST_PER_EVENT;

        const updatedCounter = await tx.usageCounter.update({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          },
          data: {
            eventCount: newEventCount,
            estimatedCost: newEstimatedCost
          }
        });

        return { trackedEvent, usageCounter: updatedCounter };
      });

      logger.info('Event tracked successfully', {
        userId,
        eventId: result.trackedEvent.id,
        source,
        eventType,
        newUsage: result.usageCounter.eventCount
      });

      return result;
    } catch (error) {
      logger.error('Error tracking event', {
        userId,
        source,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get current month usage for user
   */
  async getCurrentMonthUsage(userId) {
    const { year, month } = this.getCurrentPeriod();

    try {
      const usageCounter = await this.getOrCreateUsageCounter(userId, year, month);
      
      return {
        year,
        month,
        eventCount: usageCounter.eventCount,
        estimatedCost: parseFloat(usageCounter.estimatedCost),
        updatedAt: usageCounter.updatedAt
      };
    } catch (error) {
      logger.error('Error getting current month usage', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get usage history for user
   */
  async getUserUsageHistory(userId, limit = 12) {
    try {
      const usage = await prisma.usageCounter.findMany({
        where: { userId },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ],
        take: limit
      });

      return usage.map(u => ({
        year: u.year,
        month: u.month,
        eventCount: u.eventCount,
        estimatedCost: parseFloat(u.estimatedCost),
        updatedAt: u.updatedAt
      }));
    } catch (error) {
      logger.error('Error getting usage history', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new UsageService();
