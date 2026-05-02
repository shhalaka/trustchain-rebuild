# TrustChain Rebuild — Project Documentation

## Table of Contents
1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Frontend Documentation](#3-frontend-documentation)
4. [Backend Documentation](#4-backend-documentation)
5. [Blockchain Integration](#5-blockchain-integration)
6. [Database Schema](#6-database-schema)
7. [Authentication & Security](#7-authentication--security)
8. [API Reference](#8-api-reference)
9. [Deployment Guide](#9-deployment-guide)
10. [Development Guide](#10-development-guide)
11. [Troubleshooting](#11-troubleshooting)
12. [Changelog](#12-changelog)

---

## 1. Overview

**TrustChain Rebuild** is a full-stack document verification platform that uses the XDC Apothem blockchain to create tamper-proof certificates. Each issued document receives a unique Document ID and has its SHA-256 hash stored on-chain. Anyone can later verify the document by uploading the original file and entering its Document ID.

### Key Capabilities
- Issue digital certificates with on-chain hash storage
- Verify document authenticity via file re-upload
- QR code generation for quick mobile verification
- Admin dashboard with paginated history and search
- Zero-knowledge proof fallback when blockchain is offline
- Mock mode for development without blockchain credentials

---

## 2. Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│  XDC Apothem    │
│   (Vite + SPA)  │◄────│   (Node.js)     │◄────│   Blockchain    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   MongoDB       │
                        │   (Mongoose)    │
                        └─────────────────┘
```

### Communication Flow
1. **Issue**: Client uploads file → Server hashes file → Calls `issueCert()` on smart contract → Stores metadata in MongoDB → Returns Document ID + txHash
2. **Verify**: Client uploads file + Document ID → Server recomputes hash → Calls `verifyCert()` on contract → Compares hashes → Returns status
3. **History**: Authenticated client requests paginated list → Server queries MongoDB → Returns documents with pagination metadata

---

## 3. Frontend Documentation

### 3.1 Technology Stack
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite 4
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with interceptors for auth and 401 handling)
- **Notifications**: react-hot-toast
- **QR Codes**: qrcode.react

### 3.2 Project Structure
```
client/src/
├── api/client.js          # Axios instance with auth interceptors
├── components/
│   ├── FileUpload.jsx     # Reusable drag-and-drop file input
│   └── Spinner.jsx        # SVG loading spinner
├── pages/
│   ├── Issue.jsx          # Document issuance + QR display
│   ├── Verify.jsx         # Document verification + QR display
│   ├── History.jsx        # Paginated document table
│   └── Login.jsx          # Admin authentication
├── App.jsx                # Root component: routing, auth state, layout
├── App.css                # Complete dark-theme stylesheet
└── main.jsx               # Entry point
```

### 3.3 Component Details

#### FileUpload.jsx
- Props: `onFileSelect`, `onError`, `label`, `placeholderText`, `hintText`
- Supports drag-and-drop and click-to-select
- Validates file types (PDF, JPG, PNG) and size (10MB)
- Shows selected filename or placeholder state

#### Issue.jsx
- State: `file`, `issuer`, `result`, `loading`, `error`
- Form validation: file required, issuer required (max 100 chars)
- On success: displays Document ID, txHash, issuer, QR code
- QR code links to `/verify?docId=XXX`
- Actions: Copy Document ID, Copy txHash, Copy Link, Download QR PNG

#### Verify.jsx
- State: `file`, `documentId`, `result`, `loading`, `error`
- Auto-fills `documentId` from URL query param (`?docId=`)
- Validates Document ID format: `TC-\d{13}`
- On valid result: displays status badge, details, and QR code
- QR code only shown when `result.status === 'valid'`
- Actions: Copy Link, Download QR PNG

#### History.jsx
- State: `documents`, `loading`, `error`, `search`, `pagination`
- Fetches paginated data from `/api/v1/documents` (protected)
- Client-side search filtering by ID, filename, or issuer
- Skeleton loader while fetching
- Pagination controls (Previous / Next)
- Actions per row: Copy Document ID, View Transaction on XDC Explorer

#### Login.jsx
- State: `email`, `password`, `error`, `loading`, `showPassword`
- Client-side validation: email format, password length >= 6
- Stores JWT token and expiry (2 hours) in localStorage
- Auto-clears error messages after 8 seconds
- Password visibility toggle

### 3.4 Styling System
All styles are in `App.css` using CSS custom properties (variables):

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#0a0a0a` | Page background |
| `--surface` | `#111111` | Card backgrounds |
| `--primary` | `#0070f3` | Buttons, links |
| `--success` | `#10b981` | Valid states, badges |
| `--error` | `#ef4444` | Errors, tampered states |
| `--border` | `#2a2a2a` | Borders, dividers |
| `--text` | `#ffffff` | Primary text |
| `--text-secondary` | `#a1a1aa` | Labels, hints |

Key classes:
- `.card` — Rounded container with border and shadow
- `.form-card` — Centered card with max-width 680px
- `.result` — Success state with green background
- `.result.tampered` — Failure state with red background
- `.qr-section` — Centered QR layout with actions
- `.copy-btn` — Small secondary button for clipboard actions
- `.badge` — Status pills (success, error, info, warning)

### 3.5 Auth Flow
1. User logs in → Server returns JWT + expiry time
2. Token stored in `localStorage` with `tokenExpiry` timestamp
3. Axios request interceptor attaches `Authorization: Bearer <token>`
4. Axios response interceptor catches 401 → clears storage → redirects to `/login`
5. `App.jsx` checks token expiry on mount and route changes
6. Logout removes token and refreshes auth state

---

## 4. Backend Documentation

### 4.1 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose 7
- **File Upload**: Multer (memory storage, 10MB limit)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Security**: Helmet, CORS, express-rate-limit, compression

### 4.2 Project Structure
```
server/
├── index.js                    # Main entry: middleware, routes, DB connection
├── routes/
│   └── auth.js                 # Login and token refresh endpoints
├── middleware/
│   ├── auth.js                 # JWT verification middleware
│   ├── errorHandler.js         # Centralized error handling
│   └── rateLimiter.js          # Rate limiting configuration
├── services/
│   └── blockchainService.js    # High-level blockchain operations
├── utils/
│   ├── xdc.js                  # Ethers.js blockchain integration
│   ├── hash.js                 # SHA-256 hashing
│   ├── asyncHandler.js         # Wrap async routes for error catching
│   └── response.js             # Standardized JSON responses
├── models/
│   └── Document.js             # Mongoose schema
├── errors/
│   └── AppError.js             # Custom error classes
└── scripts/
    └── deploy.js               # Contract deployment utility
```

### 4.3 Core Modules

#### index.js
- Security middleware: Helmet, compression, CORS
- Rate limiting: general (`limiter`), auth (`authLimiter`), upload (`uploadLimiter`)
- Request logging to console
- MongoDB connection with pool size 10, 5s selection timeout
- Graceful shutdown on SIGTERM
- Routes:
  - `POST /api/v1/issue` — Issue document (public)
  - `POST /api/v1/verify` — Verify document (public)
  - `GET /api/v1/documents` — List documents (auth required)
  - `GET /api/v1/documents/:docId` — Get single document (auth required)
  - `GET /api/v1/health` — Health check (public)

#### blockchainService.js
Wraps low-level blockchain calls with validation and structured responses:

| Method | Description |
|--------|-------------|
| `issueCertificate(docId, fileBuffer)` | Hashes file, calls `issueCert()`, returns hash + txHash |
| `verifyCertificate(docId)` | Retrieves stored hash from chain |
| `verifyHash(docId, hash)` | Compares computed hash with on-chain hash |
| `getCertificateDetails(docId)` | Returns full cert details including timestamp |
| `getStatus()` | Returns connection health and mode |
| `getWalletInfo()` | Returns wallet address and XDC balance |

#### xdc.js
Low-level Ethers.js integration with the XDC Apothem network:

- **Initialization**: Validates env vars (PRIVATE_KEY, CONTRACT_ADDRESS, RPC_URL)
- **Modes**: `live` (all env vars valid) or `mock` (simulated responses)
- **Health Polling**: Checks block number every 15 seconds
- **Retry Logic**: Exponential backoff for blockchain calls (max 3 retries)
- **Event Listeners**: Registers for `CertIssued` events (currently commented out)

Smart contract ABI functions:
- `issueCert(string docId, string hash)` — nonpayable
- `verifyCert(string docId)` — view, returns string hash

#### Document.js (Mongoose Schema)
```javascript
{
  documentId: String,   // Unique, indexed, format: TC-13digits
  issuer: String,       // Required, max 100 chars
  fileName: String,     // Original uploaded filename
  hash: String,         // SHA-256 of file content
  txHash: String,       // Blockchain transaction hash
  proof: String,        // ZK-proof hash for fallback verification
  createdAt: Date       // Auto-generated
}
```

Indexes: `documentId` (unique), `hash`, `createdAt` (descending)

#### errorHandler.js
Handles specific error types:
- Multer errors (file size, unexpected file)
- Operational errors (`AppError` with status codes)
- Mongoose validation errors
- Mongoose duplicate key (409)
- Mongoose cast errors (invalid ObjectId)
- Generic 500 (production-safe, no stack traces)

---

## 5. Blockchain Integration

### 5.1 Network
- **Network**: XDC Apothem Testnet
- **Chain ID**: 51
- **RPC**: https://rpc.apothem.network
- **Explorer**: https://testnet.xdcscan.com

### 5.2 Smart Contract
The contract stores document hashes keyed by Document ID:

```solidity
function issueCert(string docId, string hash) external;
function verifyCert(string docId) external view returns (string);
```

### 5.3 Mock Mode
When `PRIVATE_KEY`, `CONTRACT_ADDRESS`, or `RPC_URL` are missing/invalid:
- `issueOnChain()` returns a mock txHash
- `verifyHashOnChain()` returns `exists: true` with mock flag
- `getHashFromChain()` returns `null`
- All documents are stored in MongoDB only
- Console logs clearly indicate `[MOCK]` prefix

### 5.4 Deployment
Use `server/scripts/deploy.js`:
1. Compile your Solidity contract (Hardhat/Remix/Truffle)
2. Replace `CONTRACT_BYTECODE` with actual compiled bytecode
3. Ensure `PRIVATE_KEY` and `RPC_URL` are set
4. Run: `node server/scripts/deploy.js`
5. Copy deployed address to `CONTRACT_ADDRESS` in `.env`

---

## 6. Database Schema

### Documents Collection
```javascript
{
  _id: ObjectId,
  documentId: "TC-1714567890123",  // Unique identifier
  issuer: "Acme Corporation",
  fileName: "contract.pdf",
  hash: "a3f5c8...",              // SHA-256 hex
  txHash: "0xmock-..." or "0xabc...",
  proof: "b7e2d9...",              // ZK fallback proof
  createdAt: ISODate("2024-05-01T10:30:00Z")
}
```

### Query Patterns
- Find by ID: `Document.findOne({ documentId })`
- List paginated: `Document.find().sort({ createdAt: -1 }).skip().limit()`
- Count total: `Document.countDocuments()`

---

## 7. Authentication & Security

### 7.1 JWT Authentication
- Algorithm: HS256
- Payload: `{ role: 'admin', email }`
- Expiry: 2 hours
- Storage: localStorage (token + tokenExpiry timestamp)
- Refresh: `/api/v1/auth/refresh` accepts expired tokens and issues new ones

### 7.2 Rate Limiting
| Route | Window | Max Requests |
|-------|--------|--------------|
| General API | 15 min | 100 |
| Auth (login/refresh) | 15 min | 10 |
| Upload (issue/verify) | 15 min | 20 |

### 7.3 Input Validation
- Document ID: Must match `^TC-\d{13}$`
- Issuer: Non-empty string, max 100 characters
- File: PDF, JPG, or PNG, max 10MB
- Email: Standard regex validation
- Password: Minimum 6 characters

### 7.4 Security Headers
Helmet middleware provides:
- Content Security Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- Strict-Transport-Security
- X-Download-Options
- X-Content-Type-Options
- X-Permitted-Cross-Domain-Policies
- Referrer-Policy

---

## 8. API Reference

### 8.1 Authentication

#### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "admin@trustchain.com",
  "password": "yourpassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "expiresIn": "2h"
  },
  "message": "Login successful"
}
```

#### POST /api/v1/auth/refresh
**Headers:** `Authorization: Bearer <token>` (expired token accepted)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "expiresIn": "2h"
  },
  "message": "Token refreshed"
}
```

### 8.2 Documents

#### POST /api/v1/issue
**Content-Type:** `multipart/form-data`

**Fields:**
- `file` — Document file (PDF, JPG, PNG, max 10MB)
- `issuer` — Issuer name (string, max 100 chars)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "documentId": "TC-1714567890123",
    "hash": "a3f5c8...",
    "issuer": "Acme Corporation",
    "txHash": "0xabc123...",
    "proof": "b7e2d9..."
  },
  "message": "Document issued successfully"
}
```

#### POST /api/v1/verify
**Content-Type:** `multipart/form-data`

**Fields:**
- `file` — Document file to verify
- `documentId` — Document ID (format: TC-13digits)

**Response (200) — Valid:**
```json
{
  "success": true,
  "data": {
    "status": "valid",
    "message": "Document is authentic and matches blockchain record",
    "documentId": "TC-1714567890123",
    "issuer": "Acme Corporation",
    "txHash": "0xabc123...",
    "blockchainStatus": "verified",
    "onChain": true,
    "existsOnChain": true,
    "verifiedAt": "2024-05-01T12:00:00.000Z"
  }
}
```

**Response (200) — Tampered:**
```json
{
  "success": true,
  "data": {
    "status": "tampered",
    "message": "Document has been modified - does not match blockchain record",
    "documentId": "TC-1714567890123",
    "issuer": null,
    "txHash": null,
    "blockchainStatus": "mismatch",
    "onChain": true,
    "existsOnChain": false,
    "verifiedAt": "2024-05-01T12:00:00.000Z"
  }
}
```

#### GET /api/v1/documents
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /api/v1/documents/:documentId
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "document": {
      "documentId": "TC-1714567890123",
      "issuer": "Acme Corporation",
      "fileName": "contract.pdf",
      "hash": "a3f5c8...",
      "txHash": "0xabc123...",
      "createdAt": "2024-05-01T10:30:00.000Z"
    }
  }
}
```

### 8.3 Health

#### GET /api/v1/health
**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-05-01T12:00:00.000Z",
    "uptime": 3600,
    "mongodb": "connected",
    "blockchain": "live"
  }
}
```

---

## 9. Deployment Guide

### 9.1 Prerequisites
- Node.js 18+
- MongoDB Atlas account or self-hosted MongoDB
- (Optional) XDC Apothem wallet with test XDC

### 9.2 Environment Setup
1. Copy `server/.env.example` to `server/.env` and fill values
2. Copy `client/.env.example` to `client/.env` and set API URL
3. Generate admin password hash:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
   ```

### 9.3 Local Development
```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev
```

### 9.4 Production Build
```bash
# Build client
cd client && npm run build
# Output: client/dist/

# Start server
cd server && npm start
```

### 9.5 Deploying Smart Contract
```bash
cd server
node scripts/deploy.js
# Copy output CONTRACT_ADDRESS to .env
```

---

## 10. Development Guide

### 10.1 Adding New Pages
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.jsx`
3. Add nav link in `Nav` component (if needed)
4. Add styles in `client/src/App.css` (if needed)

### 10.2 Adding API Endpoints
1. Add route handler in `server/index.js` or create new file in `server/routes/`
2. Use `asyncHandler()` wrapper for automatic error catching
3. Use `success()` or `error()` response helpers
4. Add auth middleware if endpoint is protected

### 10.3 Modifying the Smart Contract
1. Edit Solidity contract
2. Compile with Hardhat/Remix/Truffle
3. Update ABI in `server/utils/xdc.js`
4. Update bytecode in `server/scripts/deploy.js`
5. Deploy and update `CONTRACT_ADDRESS` in `.env`

### 10.4 Testing Mock Mode
Unset or invalidate these env vars to enable mock mode:
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS`
- `RPC_URL`

The server will log: `[xdc] Blockchain in MOCK mode`

---

## 11. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Blockchain features will use mock mode" | Missing/invalid env vars | Set valid `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `RPC_URL` |
| "Failed to issue document on blockchain" | RPC error or no gas | Check wallet balance at faucet.apothem.network |
| 401 on `/documents` | Token expired or missing | Login again or call `/auth/refresh` |
| "File too large" | Upload exceeds 10MB | Compress file or increase Multer limit |
| CORS errors | Origin mismatch | Update `CORS_ORIGIN` in server `.env` |
| MongoDB connection error | Invalid `MONGO_URI` | Check connection string and IP whitelist |
| QR code not showing | `qrcode.react` not installed | Run `npm install` in client directory |

---

## 12. Changelog

### v1.0.0 (Current)
- Initial release
- Document issue and verify with XDC Apothem blockchain
- JWT admin authentication
- Document history with pagination and search
- QR code generation on Issue page
- QR code generation on Verify page (valid results only)
- Copy link and download PNG actions for QR codes
- Mock mode for development
- Responsive dark-themed UI
- Rate limiting and security headers
