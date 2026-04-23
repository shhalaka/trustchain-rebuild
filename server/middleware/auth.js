const { AppError } = require('../errors/AppError');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('No token provided', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError('Invalid token', 401);
  }
};

module.exports = { authMiddleware };