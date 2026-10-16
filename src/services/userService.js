const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { signToken, JWT_EXPIRES_IN } = require('./tokenService');

// Compared against when the user does not exist, so response time
// does not reveal whether a username/email is registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

async function signup({ username, email, password }) {
  const existing = await User.findOne({ $or: [{ username }, { email }] }).lean();
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    logger.warn('Signup rejected: duplicate', { field });
    throw ApiError.conflict(`A user with this ${field} already exists`);
  }

  const user = await User.create({ username, email, password });
  logger.info('User registered', { user_id: user._id.toString(), username: user.username });
  return user.toJSON();
}

async function login({ username, email, password }) {
  const filter = username ? { username } : { email };
  const user = await User.findOne(filter).select('+password');

  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !valid) {
    logger.warn('Login failed: invalid credentials', { by: username ? 'username' : 'email', identifier: username || email });
    throw ApiError.unauthorized('Invalid username/email or password');
  }

  const token = signToken(user);
  logger.info('Login successful', { user_id: user._id.toString(), username: user.username });
  return { token, token_type: 'Bearer', expires_in: JWT_EXPIRES_IN, user: user.toJSON() };
}

module.exports = { signup, login };
