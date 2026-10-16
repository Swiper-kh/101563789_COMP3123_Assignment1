const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { LOG_DIR, LOG_LEVEL, NODE_ENV } = require('../config/env');

fs.mkdirSync(LOG_DIR, { recursive: true });

// Keys that must never reach a log file
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'jwt', 'secret'];

const redact = format((info) => {
  for (const key of Object.keys(info)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      info[key] = '[REDACTED]';
    }
  }
  return info;
});

const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(redact(), format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.File({ filename: path.join(LOG_DIR, 'app.log') }),
    new transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
  ],
});

if (NODE_ENV !== 'test') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

module.exports = logger;
