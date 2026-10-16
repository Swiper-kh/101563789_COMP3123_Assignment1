const logger = require('../utils/logger');

// Logs one line per request after the response is sent.
// Only method, path (without query values), status, timing and IP are logged — never bodies or tokens.
module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'HTTP request', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      duration_ms: Math.round(ms),
      ip: req.ip,
      user_id: req.user ? req.user.id : undefined,
    });
  });
  next();
};
