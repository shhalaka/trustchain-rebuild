require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');

const { generateHash } = require('./utils/hash');
const { getBlockchainMode } = require('./utils/xdc');
const BlockchainService = require('./services/blockchainService');
const { asyncHandler } = require('./utils/asyncHandler');
const { success, error } = require('./utils/response');
const { AppError, ValidationError, NotFoundError } = require('./errors/AppError');

const Document = require('./models/Document');
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { limiter, authLimiter, uploadLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Auth routes (public) - stricter rate limit
app.use('/api/v1/auth', authLimiter, require('./routes/auth'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    blockchain: getBlockchainMode()
  }, 'Service healthy');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'), false);
    }
  }
});

// Validation helpers
function validateDocumentId(documentId) {
  if (!documentId || typeof documentId !== 'string') {
    throw new ValidationError('documentId is required and must be a string');
  }
  if (!/^TC-\d{13}$/.test(documentId)) {
    throw new ValidationError('Invalid documentId format. Expected: TC- followed by 13 digits');
  }
}

function validateIssuer(issuer) {
  if (!issuer || typeof issuer !== 'string') {
    throw new ValidationError('issuer is required and must be a string');
  }
  if (issuer.trim().length === 0) {
    throw new ValidationError('issuer cannot be empty');
  }
  if (issuer.length > 100) {
    throw new ValidationError('issuer must be less than 100 characters');
  }
}

// Public routes - Issue Document (upload limited)
app.post('/api/v1/issue', uploadLimiter, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const issuer = req.body.issuer || 'Unknown';
  validateIssuer(issuer);

  const documentId = `TC-${Date.now()}`;

  // 1. Hash document (SHA-256) and call contract.issue(hash) via BlockchainService
  let result;
  try {
    result = await BlockchainService.issueCertificate(documentId, req.file.buffer);
  } catch (err) {
    console.error('Blockchain issue failed:', err.message);
    throw new AppError('Failed to issue document on blockchain', 502);
  }

  const { hash, txHash } = result;
  const proof = generateHash(Buffer.from(hash + process.env.ZK_SECRET));

  try {
    await Document.create({
      documentId,
      issuer: issuer.trim(),
      fileName: req.file.originalname,
      hash,
      txHash,
      proof
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ValidationError('Document ID already exists');
    }
    throw err;
  }

  success(res, {
    documentId,
    hash,
    issuer: issuer.trim(),
    txHash,
    proof
  }, 'Document issued successfully');
}));

// Public routes - Verify Document
app.post('/api/v1/verify', uploadLimiter, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const { documentId } = req.body;
  validateDocumentId(documentId);

  const uploadedHash = generateHash(req.file.buffer);

  // 1. Call contract.verifyCert(documentId) to get stored hash, compare with uploadedHash
  let chainResult;
  let blockchainStatus = 'unavailable';

  try {
    chainResult = await BlockchainService.verifyHash(documentId, uploadedHash);
    blockchainStatus = chainResult.onChain ? (chainResult.exists ? 'verified' : 'mismatch') : 'not_found';
  } catch (err) {
    console.error('Blockchain verify failed:', err.message);
    blockchainStatus = 'error';
  }

  // 2. Fallback: check local DB for existence
  const doc = await Document.findOne({ documentId });

  // Determine status
  let status, message;
  if (chainResult && chainResult.onChain) {
    if (chainResult.exists) {
      status = 'valid';
      message = 'Document is authentic and matches blockchain record';
    } else {
      status = 'tampered';
      message = 'Document has been modified - does not match blockchain record';
    }
  } else if (doc) {
    // Fallback to local DB ZK proof if blockchain unavailable
    const recomputedProof = generateHash(Buffer.from(uploadedHash + process.env.ZK_SECRET));
    const zkValid = recomputedProof === doc.proof;
    status = zkValid ? 'valid' : 'tampered';
    message = zkValid
      ? 'Document verified (blockchain unavailable, ZK proof valid)'
      : 'Document verification failed - does not match stored proof';
  } else {
    status = 'not_found';
    message = 'Document not found in database or blockchain';
  }

  success(res, {
    status,
    message,
    documentId,
    issuer: doc?.issuer || null,
    txHash: doc?.txHash || null,
    blockchainStatus,
    onChain: chainResult?.onChain || false,
    existsOnChain: chainResult?.exists || false,
    verifiedAt: new Date().toISOString()
  }, 'Verification complete');
}));

// Protected routes - Get Documents (requires auth)
app.get('/api/v1/documents', authMiddleware, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
  const skip = (page - 1) * limit;

  if (page < 1) {
    throw new ValidationError('Page must be at least 1');
  }

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

// Protected route - Get single document
app.get('/api/v1/documents/:documentId', authMiddleware, asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  validateDocumentId(documentId);

  const doc = await Document.findOne({ documentId });
  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  success(res, { document: doc }, 'Document retrieved');
}));

// 404 handler
app.use((req, res) => {
  error(res, 404, `Route ${req.method} ${req.path} not found`);
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
