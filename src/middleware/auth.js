const mongoose = require('mongoose');
const { verifyToken } = require('../services/tokenService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Verifies "Authorization: Bearer <jwt>" and attaches req.user = { id, username }.
// The user identity comes ONLY from the verified token, never from the request body.
module.exports = function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!header) {
    logger.warn('Auth failed: missing token', { path: req.originalUrl, ip: req.ip });
    return next(ApiError.unauthorized('Access denied. No token provided'));
  }
  if (scheme !== 'Bearer' || !token) {
    logger.warn('Auth failed: malformed Authorization header', { path: req.originalUrl, ip: req.ip });
    return next(ApiError.unauthorized('Authorization header must be: Bearer <token>'));
  }

  try {
    const payload = verifyToken(token);
    if (!mongoose.isValidObjectId(payload.sub)) throw new Error('bad subject');
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    logger.warn(`Auth failed: ${expired ? 'expired' : 'invalid'} token`, { path: req.originalUrl, ip: req.ip });
    return next(ApiError.unauthorized(expired ? 'Token has expired. Please log in again' : 'Invalid token'));
  }
};
