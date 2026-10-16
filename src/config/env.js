require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  // Fail fast instead of running with insecure defaults
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: 'comp3123_assignment1',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  AUTH_RATE_LIMIT_WINDOW_MIN: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 10) || 15,
  API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
  API_RATE_LIMIT_WINDOW_MIN: parseInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 10) || 15,
  // Vercel's filesystem is read-only except /tmp
  LOG_DIR: process.env.LOG_DIR || (process.env.VERCEL ? '/tmp/logs' : 'logs'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
