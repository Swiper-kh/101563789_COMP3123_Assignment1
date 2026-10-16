const router = require('express').Router();
const { connectDB, dbStatus } = require('../config/db');

// GET /health -> 200 when the API and DB are up, 503 if the DB is unreachable
router.get('/', async (_req, res) => {
  try {
    await connectDB();
  } catch (_e) {
    // reported below via dbStatus()
  }
  const database = dbStatus();
  const healthy = database === 'connected';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'comp3123-assignment1-api',
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: { name: 'comp3123_assignment1', state: database },
  });
});

module.exports = router;
