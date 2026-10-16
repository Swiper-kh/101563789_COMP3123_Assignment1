// Vercel serverless entry point: exports the Express app as the handler.
// DB connections are opened lazily per request by the ensureDb middleware.
module.exports = require('../src/app');
