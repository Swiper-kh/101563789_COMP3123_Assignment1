const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/env');

// 404 for any route that matched nothing
const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));

// Converts every error into a consistent JSON shape:
// { status: false, message, errors? }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON in request body');
  } else if (err.type === 'entity.too.large') {
    error = new ApiError(413, 'Request body too large');
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = ApiError.badRequest(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    );
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {}).filter((k) => k !== 'user')[0] || 'field';
    error = ApiError.conflict(`A record with this ${field} already exists`);
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(500, 'Internal server error');
  }

  if (error.statusCode >= 500) {
    logger.error('Unhandled error', { method: req.method, path: req.originalUrl.split('?')[0], error: err.message, stack: err.stack });
  } else {
    logger.warn('Request error', { method: req.method, path: req.originalUrl.split('?')[0], status: error.statusCode, reason: error.message });
  }

  const body = { status: false, message: error.message };
  if (error.details) body.errors = error.details;
  if (NODE_ENV === 'development' && error.statusCode >= 500) body.debug = err.message;
  res.status(error.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
