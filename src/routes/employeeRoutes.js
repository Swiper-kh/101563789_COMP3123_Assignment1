const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/employeeValidators');
const controller = require('../controllers/employeeController');

// Every employee route requires a valid JWT
router.use(authenticate);

router
  .route('/employees')
  .get(asyncHandler(controller.list))
  .post(v.createEmployeeRules, validate, asyncHandler(controller.create))
  .delete(v.eidQueryRule, validate, asyncHandler(controller.remove));

router
  .route('/employees/:eid')
  .get(v.eidParamRule, validate, asyncHandler(controller.getOne))
  .put(v.eidParamRule, v.updateEmployeeRules, validate, asyncHandler(controller.update));

module.exports = router;
