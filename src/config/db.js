const mongoose = require('mongoose');
const { MONGODB_URI, DB_NAME } = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

// Cache the connection promise so serverless invocations (Vercel) reuse it
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000 })
      .then((m) => {
        logger.info('MongoDB connected', { db: DB_NAME, host: m.connection.host });
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        logger.error('MongoDB connection failed', { error: err.message });
        throw err;
      });
  }
  return connectionPromise;
}

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
const dbStatus = () => STATES[mongoose.connection.readyState] || 'unknown';

module.exports = { connectDB, dbStatus };
