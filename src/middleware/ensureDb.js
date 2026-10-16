const { connectDB } = require('../config/db');
const ApiError = require('../utils/ApiError');

// Makes sure MongoDB is connected before a DB-backed route runs
// (needed on Vercel where each cold start begins disconnected).
module.exports = async function ensureDb(_req, _res, next) {
  try {
    await connectDB();
    next();
  } catch (_err) {
    next(new ApiError(503, 'Database unavailable. Please try again later'));
  }
};
