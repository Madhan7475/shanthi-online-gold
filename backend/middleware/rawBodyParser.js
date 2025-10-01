/**
 * Raw Body Parser Middleware for PhonePe Webhooks
 * 
 * This middleware captures the raw request body as a string,
 * which is required for PhonePe webhook signature validation.
 * It must be applied before any other body parsing middleware.
 */

const rawBodyParser = (req, res, next) => {
  // Only apply to PhonePe webhook endpoints
  if (!req.path.includes('/phonepe/webhook')) {
    return next();
  }

  let data = '';
  
  // Set encoding to capture raw string data
  req.setEncoding('utf8');
  
  // Collect data chunks
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process complete data
  req.on('end', () => {
    req.rawBody = data;
    
    // Parse JSON if valid
    try {
      req.body = data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse webhook body as JSON:', error.message);
      req.body = {};
    }
    
    next();
  });
  
  // Handle errors
  req.on('error', (error) => {
    console.error('Raw body parsing error:', error.message);
    next(error);
  });
};

module.exports = rawBodyParser;