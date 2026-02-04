const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usage.controller');
const authMiddleware = require('../middleware/auth');

// Routes
router.get('/current', authMiddleware, usageController.getCurrentUsage);
router.get('/history', authMiddleware, usageController.getUsageHistory);

module.exports = router;
