const usageService = require('../services/usage.service');
const billingService = require('../services/billing.service');
const logger = require('../utils/logger');

class EventsController {
  /**
   * Track an event
   * POST /api/events/track
   */
  async trackEvent(req, res, next) {
    try {
      const userId = req.user.id;
      const { source, eventType } = req.body;

      // Check if user is suspended
      if (req.user.status === 'SUSPENDED') {
        logger.warn('Suspended user attempted to track event', {
          userId,
          email: req.user.email
        });
        return res.status(403).json({
          success: false,
          message: 'Account suspended. Event tracking is disabled.'
        });
      }

      // Get current month usage
      const currentUsage = await usageService.getCurrentMonthUsage(userId);

      // Check if user can track events (billing rules)
      const { canTrack, reason } = await billingService.canTrackEvent(
        userId,
        currentUsage.eventCount
      );

      if (!canTrack) {
        logger.warn('Event tracking blocked - quota exceeded', {
          userId,
          currentUsage: currentUsage.eventCount,
          reason
        });
        return res.status(402).json({
          success: false,
          message: reason,
          code: 'PAYMENT_REQUIRED'
        });
      }

      // Track the event
      const result = await usageService.trackEvent(userId, source, eventType);

      logger.info('Event tracked', {
        userId,
        eventId: result.trackedEvent.id,
        source,
        eventType
      });

      res.status(201).json({
        success: true,
        message: 'Event tracked successfully',
        data: {
          eventId: result.trackedEvent.id,
          usage: {
            eventCount: result.usageCounter.eventCount,
            estimatedCost: parseFloat(result.usageCounter.estimatedCost)
          }
        }
      });
    } catch (error) {
      logger.error('Error in trackEvent controller', {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }
}

module.exports = new EventsController();
