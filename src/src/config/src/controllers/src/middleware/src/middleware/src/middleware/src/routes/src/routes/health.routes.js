const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Service healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
