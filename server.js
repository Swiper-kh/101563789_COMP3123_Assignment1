const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { PORT, NODE_ENV } = require('./src/config/env');
const logger = require('./src/utils/logger');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB at startup', { error: err.message });
    process.exit(1);
  }
  app.listen(PORT, () => logger.info(`Server started on port ${PORT}`, { env: NODE_ENV }));
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', { error: String(reason) }));

start();
