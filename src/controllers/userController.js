const { matchedData } = require('express-validator');
const userService = require('../services/userService');

// POST /api/v1/user/signup -> 201
exports.signup = async (req, res) => {
  const user = await userService.signup(matchedData(req, { locations: ['body'] }));
  res.status(201).json({
    status: true,
    message: 'User created successfully',
    user_id: user._id,
    user,
  });
};

// POST /api/v1/user/login -> 200
exports.login = async (req, res) => {
  const result = await userService.login(matchedData(req, { locations: ['body'] }));
  res.status(200).json({ status: true, message: 'Login successful', ...result });
};
