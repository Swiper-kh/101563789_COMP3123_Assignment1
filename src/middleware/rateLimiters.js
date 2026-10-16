const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const env = require('../config/env');

const handler = (label) => (req, res, _next, options) => {
  logger.warn(`Rate limit exceeded (${label})`, { ip: req.ip, path: req.originalUrl });
  res.status(options.statusCode).json({
    status: false,
    message: options.message,
    retry_after_seconds: Math.ceil(options.windowMs / 1000),
  });
};

// Strict limiters for signup/login to slow brute-force and account spam.
// Signup and login each get their own counter per client IP.
const makeAuthLimiter = (label) =>
  rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many authentication attempts. Please try again later.',
    handler: handler(label),
  });

const signupLimiter = makeAuthLimiter('signup');
const loginLimiter = makeAuthLimiter('login');

// General limiter for all /api traffic
const apiLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  limit: env.API_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many requests. Please slow down.',
  handler: handler('api'),
});

module.exports = { signupLimiter, loginLimiter, apiLimiter };
