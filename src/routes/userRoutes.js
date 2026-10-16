const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { signupLimiter, loginLimiter } = require('../middleware/rateLimiters');
const { signupRules, loginRules } = require('../validators/userValidators');
const controller = require('../controllers/userController');

router.post('/signup', signupLimiter, signupRules, validate, asyncHandler(controller.signup));
router.post('/login', loginLimiter, loginRules, validate, asyncHandler(controller.login));

module.exports = router;
