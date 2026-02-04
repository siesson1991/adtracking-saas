const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format,
  }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    }),
  ],
});

module.exports = logger;
```

---

### logs/.gitkeep
```
# This file ensures the logs directory is tracked by git but remains empty
