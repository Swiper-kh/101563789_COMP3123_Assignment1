const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Every query below is scoped by { user: ownerId }, where ownerId comes from the
// verified JWT. A user cannot reach another user's data by changing eid.

const listForOwner = (ownerId) =>
  Employee.find({ user: ownerId }).sort({ created_at: -1 }).lean();

async function createForOwner(ownerId, data) {
  const employee = await Employee.create({ ...data, user: ownerId });
  logger.info('Employee created', { user_id: ownerId, employee_id: employee._id.toString() });
  return employee.toObject();
}

// Explains WHY an owner-scoped lookup found nothing: 403 if the employee
// exists under a different owner, 404 if it does not exist at all.
async function rejectMissing(ownerId, eid, action) {
  const exists = await Employee.exists({ _id: eid });
  if (exists) {
    logger.warn('Authorization failed: employee belongs to another user', { user_id: ownerId, employee_id: eid, action });
    throw ApiError.forbidden('You are not allowed to access this employee');
  }
  throw ApiError.notFound('Employee not found');
}

async function getForOwner(ownerId, eid) {
  const employee = await Employee.findOne({ _id: eid, user: ownerId }).lean();
  if (!employee) await rejectMissing(ownerId, eid, 'read');
  return employee;
}

async function updateForOwner(ownerId, eid, changes) {
  const employee = await Employee.findOneAndUpdate(
    { _id: eid, user: ownerId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true, lean: true }
  );
  if (!employee) await rejectMissing(ownerId, eid, 'update');
  logger.info('Employee updated', { user_id: ownerId, employee_id: eid, fields: Object.keys(changes).join(',') });
  return employee;
}

async function deleteForOwner(ownerId, eid) {
  const result = await Employee.deleteOne({ _id: eid, user: ownerId });
  if (result.deletedCount === 0) await rejectMissing(ownerId, eid, 'delete');
  logger.info('Employee deleted', { user_id: ownerId, employee_id: eid });
}

module.exports = { listForOwner, createForOwner, getForOwner, updateForOwner, deleteForOwner };
