# TrustChain Rebuild

A tamper-proof document verification system built on the XDC Apothem blockchain. Issue digital certificates, verify document authenticity via SHA-256 hashing, and view issuance history through a modern React dashboard.

## Features

- **Issue Documents** — Upload PDF/JPG/PNG files, generate SHA-256 hashes, and store them on-chain.
- **Verify Documents** — Upload a file and enter a Document ID to check authenticity against blockchain records.
- **QR Code Generation** — Both Issue and Verify pages generate scannable QR codes linking to the verification URL.
- **Copy & Download** — Copy verification links or download QR codes as PNG images.
- **Admin Dashboard** — JWT-protected login with session expiry, paginated document history, search, and transaction explorer links.
- **Zero-Knowledge Fallback** — If the blockchain is unavailable, a local ZK-proof secret verifies documents.
- **Mock Mode** — Runs without blockchain credentials for local development and testing.
- **Responsive UI** — Dark-themed, mobile-friendly interface with toast notifications and loading skeletons.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router DOM, react-hot-toast, qrcode.react, Axios |
| Backend | Node.js, Express 4, Mongoose 7, Multer, bcryptjs, jsonwebtoken |
| Blockchain | XDC Apothem Testnet, Ethers.js v5, Smart Contract (Solidity) |
| Database | MongoDB |
| Security | Helmet, CORS, Express Rate Limit, JWT Auth, Input Validation |

## Project Structure

```
trustchain-rebuild/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── api/client.js            # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   ├── FileUpload.jsx       # Drag-and-drop file upload component
│   │   │   └── Spinner.jsx          # Loading spinner
│   │   ├── pages/
│   │   │   ├── Issue.jsx            # Issue document + QR code
│   │   │   ├── Verify.jsx           # Verify document + QR code
│   │   │   ├── History.jsx          # Paginated document list
│   │   │   └── Login.jsx            # Admin login with JWT
│   │   ├── App.jsx                  # Router, auth state, layout
│   │   └── App.css                  # Dark theme styling
│   ├── .env.example                 # VITE_API_URL
│   └── package.json
│
├── server/                          # Express Backend
│   ├── index.js                     # Main server: routes, middleware, MongoDB
│   ├── routes/
│   │   └── auth.js                  # JWT login & token refresh
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification middleware
│   │   ├── errorHandler.js          # Global error handler
│   │   └── rateLimiter.js           # Rate limiting rules
│   ├── services/
│   │   └── blockchainService.js     # Business logic wrapper for blockchain
│   ├── utils/
│   │   ├── xdc.js                   # Ethers.js blockchain integration
│   │   ├── hash.js                  # SHA-256 hashing utility
│   │   ├── asyncHandler.js          # Async error wrapper
│   │   └── response.js              # Standardized API responses
│   ├── models/
│   │   └── Document.js              # Mongoose schema for issued docs
│   ├── errors/
│   │   └── AppError.js              # Custom error classes
│   ├── scripts/
│   │   └── deploy.js                # Smart contract deployment script
│   ├── .env.example                 # All server environment variables
│   └── package.json
│
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- (Optional) XDC Apothem wallet with test XDC from [faucet.apothem.network](https://faucet.apothem.network)

### 1. Clone & Install

```bash
git clone <repo-url>
cd trustchain-rebuild

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Setup

**Server** (`server/.env`):
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-super-secret-key
ADMIN_EMAIL=admin@trustchain.com
ADMIN_PASSWORD_HASH=$2b$10$...   # bcrypt hashed password
RPC_URL=https://rpc.apothem.network
CONTRACT_ADDRESS=0xYourContractAddress
PRIVATE_KEY=0xYourPrivateKey
ZK_SECRET=your-zk-secret
CORS_ORIGIN=http://localhost:5173
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:3000/api/v1
```

> **Tip:** If you skip `CONTRACT_ADDRESS` and `PRIVATE_KEY`, the server runs in **mock mode** — all blockchain calls are simulated and documents are stored locally only.

### 3. Run

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Health Check: http://localhost:3000/api/v1/health

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Admin login, returns JWT |
| POST | `/api/v1/auth/refresh` | No | Refresh expired token |
| POST | `/api/v1/issue` | No | Issue a document (multipart/form-data) |
| POST | `/api/v1/verify` | No | Verify a document (multipart/form-data) |
| GET | `/api/v1/documents` | Yes | List issued documents (paginated) |
| GET | `/api/v1/documents/:docId` | Yes | Get single document details |
| GET | `/api/v1/health` | No | Service health & blockchain status |

## Smart Contract

The system interacts with a Solidity smart contract on XDC Apothem with two main functions:

- `issueCert(string docId, string hash)` — Stores a document hash on-chain.
- `verifyCert(string docId)` — Returns the stored hash for comparison.

A deployment script is provided at `server/scripts/deploy.js`. Update `CONTRACT_BYTECODE` with your compiled artifact before running.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash of admin password |
| `RPC_URL` | No | XDC Apothem RPC endpoint |
| `CONTRACT_ADDRESS` | No | Deployed smart contract address |
| `PRIVATE_KEY` | No | Wallet private key for on-chain transactions |
| `ZK_SECRET` | No | Secret for local ZK-proof verification fallback |
| `CORS_ORIGIN` | No | Allowed frontend origin (default: localhost:5173) |
| `RATE_LIMIT_WINDOW` | No | Rate limit window in ms (default: 15 min) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 100) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` (client) | Start Vite dev server |
| `npm run build` (client) | Production build |
| `npm run dev` (server) | Start server with nodemon |
| `npm start` (server) | Start server with node |
| `node scripts/deploy.js` | Deploy smart contract to XDC Apothem |

## Security

- **Helmet** — HTTP security headers
- **Rate Limiting** — Separate limits for auth, uploads, and general API
- **JWT Authentication** — 2-hour expiry with Bearer token scheme
- **Input Validation** — Document ID format (`TC-\d{13}`), file type whitelist, size limits (10MB)
- **CORS** — Origin-restricted cross-origin requests
- **Password Hashing** — bcryptjs for admin credentials
- **Error Handling** — Operational vs programming errors, no stack traces in production

## License

MIT

## Author

Built for secure, transparent document verification on XDC Network.
