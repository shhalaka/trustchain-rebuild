const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const docs = await Document.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Document.countDocuments();

  success(res, {
    documents: docs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, 'Documents retrieved successfully');
}));

module.exports = router;