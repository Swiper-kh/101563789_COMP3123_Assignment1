const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Runs after an express-validator chain; returns 400 with field-level errors
module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  logger.warn('Validation failed', {
    method: req.method,
    path: req.originalUrl,
    fields: errors.map((e) => e.field).join(','),
  });
  return next(ApiError.badRequest('Validation failed', errors));
};
