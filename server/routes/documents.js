const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { asyncHandler } = require('../utils/asyncHandler');
const { success } = require('../utils/response');

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Document.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments()
  ]);

  success(res, {
    documents: docs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  }, 'Documents retrieved successfully');
}));

module.exports = router;