require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const rawBodyMiddleware = require('./middleware/rawBody');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const eventsRoutes = require('./routes/events.routes');
const usageRoutes = require('./routes/usage.routes');
const storeRoutes = require('./routes/store.routes');
const webhooksRoutes = require('./routes/webhooks.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Raw body middleware for webhooks (must be before body parsers)
app.use(rawBodyMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/stores', storeRoutes);
app.use('/webhooks', webhooksRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
