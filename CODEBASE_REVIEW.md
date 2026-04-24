# TrustChain Rebuild - Codebase Review

## Project Overview

**TrustChain Rebuild** is a modernized document verification system on XDC blockchain with a dark-themed UI. This is a refactored/improved version of the original TrustChain-Docs project.

**Location**: `C:\Users\Administrator\Desktop\trustchain-rebuild`

---

## Architecture

```
trustchain-rebuild/
├── client/                          # React + Vite Frontend
│   ├── .env                         # VITE_API_URL=http://localhost:3000/api/v1
│   ├── package.json                 # React 18, Axios, React Router, react-hot-toast
│   ├── index.html
│   ├── DESIGN.md                    # Design system documentation
│   └── src/
│       ├── App.jsx                  # Router setup with Issue/Verify/History
│       ├── App.css                  # Dark theme styling
│       ├── index.css                # Base styles
│       ├── main.jsx                 # Entry point
│       └── pages/
│           ├── Issue.jsx            # Document issuance UI
│           ├── Verify.jsx           # Document verification UI
│           └── History.jsx          # Document list (no auth yet)
│
└── server/                          # Node.js + Express Backend
    ├── .env                         # All config (see below)
    ├── package.json                 # Express, Mongoose, Ethers, JWT, bcrypt
    ├── index.js                     # Main server (all routes inline)
    ├── models/
    │   └── Document.js              # Mongoose schema with proof field
    ├── routes/
    │   └── auth.js                  # /login with bcrypt
    ├── middleware/
    │   ├── auth.js                  # JWT verification (MISSING jwt import!)
    │   ├── errorHandler.js          # Global error handler
    │   └── rateLimiter.js           # Express-rate-limit
    ├── utils/
    │   ├── hash.js                  # SHA-256 generation
    │   ├── xdc.js                   # Blockchain interaction (with fallbacks)
    │   ├── asyncHandler.js          # Async wrapper
    │   └── response.js              # Standardized response helpers
    └── errors/
        └── AppError.js              # Custom error classes
```

---

## What's Improved vs Original (TrustChain-Docs)

| Feature | Original | Rebuild |
|---------|----------|---------|
| API URL consistency | ❌ Broken (missing `/api/v1/`) | ✅ Fixed |
| History response parsing | ❌ Broken | ✅ Fixed |
| JWT import | ❌ Missing | ❌ Still missing |
| Auth middleware usage | ❌ Conflicting routes | ✅ Clean implementation |
| Password hashing | ❌ Plaintext | ✅ bcrypt |
| ZK Proof | ❌ Cosmetic only | ✅ Actual implementation |
| Design system | ❌ Ad-hoc | ✅ Documented dark theme |
| File upload UX | ❌ Basic input | ✅ Drop zone |
| Blockchain fallbacks | ❌ None | ✅ Mock tx when not configured |
| Document schema | ❌ Basic | ✅ Indexed, required fields |
| Environment validation | ❌ None | ⚠️ Partial (xdc.js warnings) |

---

## Issues Found

### 🔴 CRITICAL

#### 1. **Missing `jwt` Import in Auth Middleware**
**File**: `server/middleware/auth.js`

**Problem**: Uses `jwt.verify()` but never imports `jsonwebtoken`.

```javascript
const { AppError } = require('../errors/AppError');

const authMiddleware = (req, res, next) => {
  // ...
  const decoded = jwt.verify(token, process.env.JWT_SECRET);  // ❌ jwt is undefined
```

**Impact**: Server crashes on any authenticated request to `/api/v1/documents`.

**Fix**:
```javascript
const jwt = require('jsonwebtoken');
const { AppError } = require('../errors/AppError');
```

---

#### 2. **Auth Route Not Mounted**
**File**: `server/index.js`

**Problem**: `auth.js` route file exists but is never mounted in `index.js`. The `/login` endpoint doesn't exist.

```javascript
// index.js - missing:
// app.use('/api/v1/auth', require('./routes/auth'));
```

**Impact**: Login is impossible. History page (which requires auth) is inaccessible.

**Fix**: Add to `index.js`:
```javascript
app.use('/api/v1/auth', require('./routes/auth'));
```

---

#### 3. **History.jsx Missing Auth Headers**
**File**: `client/src/pages/History.jsx`

**Problem**: Calls `/api/v1/documents` without Authorization header, but backend requires `authMiddleware`.

```javascript
const res = await axios.get(`${API}/documents`);  // ❌ No token
```

**Impact**: History page gets 401 Unauthorized.

**Fix**:
```javascript
const token = localStorage.getItem('token');
const res = await axios.get(`${API}/documents`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

#### 4. **No Login Page in Frontend**
**File**: `client/src/App.jsx`, `client/src/pages/`

**Problem**: No login route or component. User cannot authenticate to access History.

**Impact**: History page is permanently inaccessible (401).

**Fix**: Add Login page and route, store token in localStorage.

---

### 🟠 HIGH

#### 5. **Duplicate `ADMIN_PASSWORD_HASH` in .env**
**File**: `server/.env`

**Problem**: Two entries for `ADMIN_PASSWORD_HASH`:
```env
ADMIN_PASSWORD_HASH=$2a$10$YourHashedPasswordHere
# ... later ...
ADMIN_PASSWORD_HASH=$2b$10$BjrWhzKZYmUSZe3eroHFoOBpESmUZzOogsLMY/FXVReXIjScgmsmG
```

**Impact**: Second value overwrites first. Confusing which is active.

**Fix**: Remove duplicate line.

---

#### 6. **No Input Validation**
**File**: `server/index.js`

**Problem**: No validation on:
- `issuer` field (can be empty, any length)
- `documentId` format (should match `TC-\d+` pattern)
- File size/type beyond multer's basic check

**Impact**: Invalid data can be stored. No format guarantees.

---

#### 7. **No CORS Preflight Handling**
**File**: `server/index.js`

**Problem**: `cors()` middleware handles simple requests but no explicit `OPTIONS` handling for preflight with credentials.

**Impact**: May fail on some browser configurations.

---

#### 8. **Missing Rate Limiter Application**
**File**: `server/index.js`

**Problem**: `limiter` is imported but never applied to routes.

```javascript
const { limiter } = require('./middleware/rateLimiter');
// ... never used
```

**Impact**: No rate limiting on any endpoint.

**Fix**: Add `app.use(limiter)` or apply to specific routes.

---

### 🟡 MEDIUM

#### 9. **No Health Check Endpoint**
**File**: `server/index.js`

**Problem**: No `/health` or `/status` endpoint for monitoring.

---

#### 10. **No API Error Handling in Frontend**
**File**: `client/src/pages/History.jsx`, `client/src/pages/Issue.jsx`, `client/src/pages/Verify.jsx`

**Problem**: Only basic error display. No:
- Token expiry handling (no redirect to login)
- Network error differentiation
- Retry logic
- Loading states for Issue/Verify

---

#### 11. **Unused Dependencies**
**File**: `server/package.json`

**Problem**: Several packages installed but not used:
- `apicache` - not imported
- `joi` - not used for validation
- `winston` - not used (console.log used instead)

---

#### 12. **No Pagination UI in History**
**File**: `client/src/pages/History.jsx`

**Problem**: Backend supports pagination but frontend ignores it. Shows all documents at once.

---

#### 13. **Missing `documentId` in Verify Response Display**
**File**: `client/src/pages/Verify.jsx`

**Problem**: Backend returns `documentId` but frontend doesn't display it in results.

```javascript
// Verify.jsx shows:
<p><strong>Document ID:</strong> {result.documentId}</p>  // ✅ Actually present
```

Wait - it IS there. But backend doesn't return it:
```javascript
// server/index.js verify endpoint:
success(res, {
  status: uploadedHash === storedHash ? 'valid' : 'tampered',
  message: uploadedHash === storedHash ? '...' : '...',
  issuer: doc.issuer,
  txHash: doc.txHash,
  zkValid
  // ❌ documentId missing!
}, 'Verification complete');
```

---

### 🟢 LOW

#### 14. **No Logout Functionality**
**File**: `client/src/App.jsx`

**Problem**: No way to clear token/logout. Token persists until expiry.

---

#### 15. **No Token Refresh**
**File**: `server/routes/auth.js`

**Problem**: Token expires in 2h with no refresh mechanism. User must re-login.

---

#### 16. **Design System Not Fully Implemented**
**File**: `client/DESIGN.md`

**Problem**: Comprehensive design system documented but:
- No `Geist` font loaded
- No skeleton loading states
- No animation implementations
- Table styling basic

---

#### 17. **No Tests**
**File**: Entire project

**Problem**: No unit tests, integration tests, or e2e tests.

---

## Environment Variables

```env
# Server (.env)
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://admin:admin123@cluster0.qfoofaf.mongodb.net/?appName=Cluster0
JWT_SECRET=your-jwt-secret-key-min-32-chars-long
ADMIN_EMAIL=admin@trustchain.com
ADMIN_PASSWORD_HASH=$2b$10$BjrWhzKZYmUSZe3eroHFoOBpESmUZzOogsLMY/FXVReXIjScgmsmG
RPC_URL=https://rpc.apothem.network
CONTRACT_ADDRESS=0xCFA19F1517Ffbe08Ca5A8bACf022E00E2eA5b18c
PRIVATE_KEY=your-private-key-here
ZK_SECRET=your-zk-secret-key-here
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Client (.env)
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Security Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Password hashing | ✅ | bcrypt with salt |
| JWT authentication | ⚠️ | Implemented but broken (missing import) |
| Rate limiting | ❌ | Imported but not applied |
| CORS | ⚠️ | Basic config, no preflight handling |
| Helmet | ✅ | Applied |
| Input validation | ❌ | No validation beyond multer |
| File upload limits | ✅ | 10MB, PDF/JPG/PNG only |
| Environment isolation | ⚠️ | .env committed? (check git) |
| HTTPS | ❌ | Not configured |
| XSS protection | ⚠️ | Helmet provides basics |

---

## Blockchain Integration

| Aspect | Status |
|--------|--------|
| Contract interaction | ✅ | issueCert + verifyCert |
| Fallback mode | ✅ | Mock tx when not configured |
| Network | ✅ | XDC Apothem testnet |
| Error handling | ⚠️ | Basic console.warn |
| Transaction confirmation | ✅ | `tx.wait()` |

---

## Summary Table

| # | Issue | Severity | File |
|---|-------|----------|------|
| 1 | Missing `jwt` import | 🔴 CRITICAL | `middleware/auth.js` |
| 2 | Auth route not mounted | 🔴 CRITICAL | `index.js` |
| 3 | History missing auth headers | 🔴 CRITICAL | `History.jsx` |
| 4 | No login page | 🔴 CRITICAL | `App.jsx` |
| 5 | Duplicate env var | 🟠 HIGH | `.env` |
| 6 | No input validation | 🟠 HIGH | `index.js` |
| 7 | No CORS preflight | 🟠 HIGH | `index.js` |
| 8 | Rate limiter not applied | 🟠 HIGH | `index.js` |
| 9 | No health check | 🟡 MEDIUM | `index.js` |
| 10 | No error handling in frontend | 🟡 MEDIUM | `*.jsx` |
| 11 | Unused dependencies | 🟡 MEDIUM | `package.json` |
| 12 | No pagination UI | 🟡 MEDIUM | `History.jsx` |
| 13 | Missing documentId in verify response | 🟡 MEDIUM | `index.js` |
| 14 | No logout | 🟢 LOW | `App.jsx` |
| 15 | No token refresh | 🟢 LOW | `auth.js` |
| 16 | Design system incomplete | 🟢 LOW | `DESIGN.md` |
| 17 | No tests | 🟢 LOW | All |

---

## Recommended Fix Priority

### Immediate (App Won't Work Without)
1. Add `const jwt = require('jsonwebtoken')` to `middleware/auth.js`
2. Mount auth route: `app.use('/api/v1/auth', require('./routes/auth'))`
3. Add login page to frontend
4. Add auth headers to History.jsx

### Next
5. Remove duplicate `ADMIN_PASSWORD_HASH` from `.env`
6. Apply rate limiter: `app.use('/api/v1/', limiter)`
7. Add input validation (Joi or manual)
8. Fix CORS preflight

### Later
9. Add health check endpoint
10. Add logout functionality
11. Implement pagination UI
12. Add token refresh mechanism
13. Remove unused dependencies
14. Add tests

---

## Positive Notes

- ✅ Clean architecture with separated concerns
- ✅ Actual ZK proof implementation (hash + secret)
- ✅ Proper error handling classes
- ✅ Standardized API responses
- ✅ Dark theme design system documented
- ✅ Blockchain fallback for development
- ✅ bcrypt password hashing
- ✅ File type and size restrictions
- ✅ MongoDB indexing on Document schema

---

*Review generated for trustchain-rebuild project*
