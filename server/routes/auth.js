const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return success(res, { token }, 'Login successful');
  }

  error(res, 401, 'Invalid credentials');
});

module.exports = router;