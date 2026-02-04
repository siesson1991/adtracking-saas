const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const eventsController = require('../controllers/events.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const trackEventValidation = [
  body('source')
    .isIn([
      'SHOPIFY',
      'WOOCOMMERCE',
      'BIGCOMMERCE',
      'MAGENTO',
      'CUSTOM_SITE_1',
      'CUSTOM_SITE_2',
      'META_ADS',
      'GOOGLE_ADS',
      'TIKTOK_ADS',
      'X_ADS',
      'SNAPCHAT_ADS',
      'REDDIT_ADS',
      'PINTEREST_ADS'
    ])
    .withMessage('Invalid event source'),
  body('eventType')
    .trim()
    .notEmpty()
    .withMessage('Event type is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Event type must be between 1 and 100 characters')
];

// Routes
router.post(
  '/track',
  authMiddleware,
  trackEventValidation,
  validate,
  eventsController.trackEvent
);

module.exports = router;
