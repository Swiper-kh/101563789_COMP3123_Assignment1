const { body } = require('express-validator');
const { allowOnly } = require('./common');

const signupRules = [
  allowOnly(['username', 'email', 'password']),
  body('username')
    .exists({ values: 'falsy' }).withMessage('Username is required').bail()
    .isString().withMessage('Username must be a string').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').bail()
    .matches(/^[a-zA-Z0-9_.]+$/).withMessage('Username may contain only letters, numbers, underscores and dots'),
  body('email')
    .exists({ values: 'falsy' }).withMessage('Email is required').bail()
    .isString().withMessage('Email must be a string').bail()
    .trim()
    .isLength({ max: 100 }).withMessage('Email must be at most 100 characters').bail()
    .isEmail().withMessage('Email format is invalid').bail()
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string').bail()
    .isLength({ min: 8, max: 64 }).withMessage('Password must be 8-64 characters').bail()
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter').bail()
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter').bail()
    .matches(/\d/).withMessage('Password must contain a number'),
];

// Login accepts { username, password } OR { email, password }
const loginRules = [
  allowOnly(['username', 'email', 'password']),
  body().custom((value) => {
    if (!value || (!value.username && !value.email)) {
      throw new Error('Username or email is required');
    }
    return true;
  }),
  body('username').optional().isString().withMessage('Username must be a string').bail().trim()
    .isLength({ min: 1, max: 30 }).withMessage('Username is too long'),
  body('email').optional().isString().withMessage('Email must be a string').bail().trim()
    .isEmail().withMessage('Email format is invalid').bail().normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .exists({ values: 'falsy' }).withMessage('Password is required').bail()
    .isString().withMessage('Password must be a string').bail()
    .isLength({ max: 64 }).withMessage('Password is too long'),
];

module.exports = { signupRules, loginRules };
