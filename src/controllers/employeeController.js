const { matchedData } = require('express-validator');
const employeeService = require('../services/employeeService');

const bodyData = (req) => matchedData(req, { locations: ['body'] });

// GET /api/v1/emp/employees -> 200
exports.list = async (req, res) => {
  const employees = await employeeService.listForOwner(req.user.id);
  res.status(200).json({ status: true, count: employees.length, employees });
};

// POST /api/v1/emp/employees -> 201
exports.create = async (req, res) => {
  const employee = await employeeService.createForOwner(req.user.id, bodyData(req));
  res.status(201).json({
    status: true,
    message: 'Employee created successfully',
    employee_id: employee._id,
    employee,
  });
};

// GET /api/v1/emp/employees/:eid -> 200
exports.getOne = async (req, res) => {
  const employee = await employeeService.getForOwner(req.user.id, req.params.eid);
  res.status(200).json({ status: true, employee });
};

// PUT /api/v1/emp/employees/:eid -> 200
exports.update = async (req, res) => {
  const employee = await employeeService.updateForOwner(req.user.id, req.params.eid, bodyData(req));
  res.status(200).json({ status: true, message: 'Employee details updated successfully', employee });
};

// DELETE /api/v1/emp/employees?eid=xxx -> 204 (no body)
exports.remove = async (req, res) => {
  await employeeService.deleteForOwner(req.user.id, req.query.eid);
  res.status(204).send();
};
