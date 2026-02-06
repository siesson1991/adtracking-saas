/**
 * Middleware to capture raw body for webhook signature verification
 */
const rawBodyMiddleware = (req, res, next) => {
  if (req.path.startsWith('/webhooks/')) {
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

module.exports = rawBodyMiddleware;
