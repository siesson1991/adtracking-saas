const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Logging
prisma.$on('warn', (e) => {
  logger.warn('Prisma warning', { message: e.message });
});

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message });
});

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
}

testConnection();

module.exports = prisma;
