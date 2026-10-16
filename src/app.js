const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const ensureDb = require('./middleware/ensureDb');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// Behind Vercel's proxy: use the real client IP for rate limiting
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));

app.get('/', (_req, res) =>
  res.json({
    status: true,
    message: 'COMP3123 Assignment 1 API',
    endpoints: ['/health', '/api/v1/user/signup', '/api/v1/user/login', '/api/v1/emp/employees'],
  })
);
app.use('/health', healthRoutes);

app.use('/api', apiLimiter, ensureDb);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
