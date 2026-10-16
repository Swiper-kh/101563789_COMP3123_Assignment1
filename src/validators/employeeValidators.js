const { body, param, query } = require('express-validator');
const { allowOnly } = require('./common');

const FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

const NAME_RE = /^[\p{L}][\p{L}\s'.-]*$/u;

// Builds the rule set; `optional` = true for PUT (partial update)
const employeeBody = (optional) => {
  const field = (name) => {
    const chain = body(name);
    return optional ? chain.optional() : chain.exists({ values: 'falsy' }).withMessage(`${name} is required`).bail();
  };

  return [
    allowOnly(FIELDS),
    field('first_name').isString().withMessage('first_name must be a string').bail().trim()
      .isLength({ min: 1, max: 50 }).withMessage('first_name must be 1-50 characters').bail()
      .matches(NAME_RE).withMessage('first_name contains invalid characters'),
    field('last_name').isString().withMessage('last_name must be a string').bail().trim()
      .isLength({ min: 1, max: 50 }).withMessage('last_name must be 1-50 characters').bail()
      .matches(NAME_RE).withMessage('last_name contains invalid characters'),
    field('email').isString().withMessage('email must be a string').bail().trim()
      .isLength({ max: 100 }).withMessage('email must be at most 100 characters').bail()
      .isEmail().withMessage('email format is invalid').bail()
      .normalizeEmail({ gmail_remove_dots: false }),
    field('position').isString().withMessage('position must be a string').bail().trim()
      .isLength({ min: 1, max: 100 }).withMessage('position must be 1-100 characters'),
    field('salary')
      .not().isArray().withMessage('salary must be a number').bail()
      .isFloat({ gt: 0, max: 10000000 }).withMessage('salary must be a positive number (max 10,000,000)').bail()
      .toFloat(),
    field('date_of_joining')
      .isISO8601({ strict: true }).withMessage('date_of_joining must be a valid date (YYYY-MM-DD)').bail()
      .custom((v) => {
        const d = new Date(v);
        if (d.getFullYear() < 1950) throw new Error('date_of_joining must be after 1950');
        const limit = new Date();
        limit.setFullYear(limit.getFullYear() + 1);
        if (d > limit) throw new Error('date_of_joining cannot be more than one year in the future');
        return true;
      }).bail()
      .toDate(),
    field('department').isString().withMessage('department must be a string').bail().trim()
      .isLength({ min: 1, max: 100 }).withMessage('department must be 1-100 characters'),
  ];
};

const createEmployeeRules = employeeBody(false);

const updateEmployeeRules = [
  body().custom((value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
  ...employeeBody(true),
];

const eidParamRule = [param('eid').isMongoId().withMessage('eid must be a valid employee ID')];

const eidQueryRule = [
  query('eid')
    .exists({ values: 'falsy' }).withMessage('eid query parameter is required').bail()
    .isString().withMessage('eid must be a single value').bail()
    .isMongoId().withMessage('eid must be a valid employee ID'),
];

module.exports = { createEmployeeRules, updateEmployeeRules, eidParamRule, eidQueryRule };
