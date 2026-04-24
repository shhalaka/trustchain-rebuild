const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');
const { ValidationError } = require('../errors/AppError');

// Validation
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }
}

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateEmail(email);
  validatePassword(password);

  if (email !== process.env.ADMIN_EMAIL) {
    return error(res, 401, 'Invalid credentials');
  }

  // Check hashed password
  let isValid = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  } else if (process.env.ADMIN_PASSWORD) {
    isValid = password === process.env.ADMIN_PASSWORD;
  }

  if (!isValid) {
    return error(res, 401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { role: 'admin', email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return success(res, { token, expiresIn: '2h' }, 'Login successful');
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return error(res, 401, 'No token provided');
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    if (decoded.role !== 'admin') {
      return error(res, 403, 'Not authorized');
    }

    const newToken = jwt.sign(
      { role: 'admin', email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return success(res, { token: newToken, expiresIn: '2h' }, 'Token refreshed');
  } catch (err) {
    return error(res, 401, 'Invalid token');
  }
}));

module.exports = router;
