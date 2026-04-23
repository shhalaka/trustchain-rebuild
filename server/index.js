const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');

const { generateHash } = require('./utils/hash');
const { issueOnChain, getHashFromChain } = require('./utils/xdc');
const { asyncHandler } = require('./utils/asyncHandler');
const { success, error } = require('./utils/response');
const { AppError } = require('./errors/AppError');

const Document = require('./models/Document');
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

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

// Public routes (no auth required)
app.post('/api/v1/issue', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const hash = generateHash(req.file.buffer);
  const documentId = `TC-${Date.now()}`;
  const issuer = req.body.issuer || 'Unknown';

  const txHash = await issueOnChain(documentId, hash);
  const proof = generateHash(Buffer.from(hash + process.env.ZK_SECRET));

  await Document.create({
    documentId,
    issuer,
    fileName: req.file.originalname,
    txHash,
    proof
  });

  success(res, { documentId, hash, issuer, txHash, proof }, 'Document issued');
}));

app.post('/api/v1/verify', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const { documentId } = req.body;
  if (!documentId) {
    throw new AppError('documentId required', 400);
  }

  const uploadedHash = generateHash(req.file.buffer);
  let storedHash = null;
  
  try {
    storedHash = await getHashFromChain(documentId);
  } catch (err) {
    console.log('Blockchain fetch failed:', err.message);
  }

  const doc = await Document.findOne({ documentId });
  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  const recomputedProof = generateHash(Buffer.from(uploadedHash + process.env.ZK_SECRET));
  const zkValid = recomputedProof === doc.proof;

  success(res, {
    status: uploadedHash === storedHash ? 'valid' : 'tampered',
    message: uploadedHash === storedHash
      ? 'Document is authentic'
      : 'Document has been modified',
    issuer: doc.issuer,
    txHash: doc.txHash,
    zkValid
  }, 'Verification complete');
}));

// Public documents route (no auth for now)
app.get('/api/v1/documents', asyncHandler(async (req, res) => {
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
  }, 'Documents retrieved');
}));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));