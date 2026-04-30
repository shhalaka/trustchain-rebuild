require('dotenv').config();
const ethers = require('ethers');

// ─── Configuration ──────────────────────────────────────────────────

const REQUIRED_ENV_VARS = {
  RPC_URL: process.env.RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  PRIVATE_KEY: process.env.PRIVATE_KEY
};

const OPTIONAL_ENV_VARS = {
  ZK_SECRET: process.env.ZK_SECRET,
  BLOCKCHAIN_POLL_INTERVAL: parseInt(process.env.BLOCKCHAIN_POLL_INTERVAL, 10) || 15000,
  BLOCKCHAIN_MAX_RETRIES: parseInt(process.env.BLOCKCHAIN_MAX_RETRIES, 10) || 3,
  BLOCKCHAIN_RETRY_DELAY: parseInt(process.env.BLOCKCHAIN_RETRY_DELAY, 10) || 2000
};

// ─── Helpers ──────────────────────────────────────────────────────────

function isValidPrivateKey(key) {
  try {
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}

function isValidContractAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const placeholders = [
    'your-contract-address-here',
    'your_contract_address_here',
    'YOUR_CONTRACT_ADDRESS',
    '0x0000000000000000000000000000000000000000'
  ];
  if (placeholders.includes(address) || placeholders.some(p => address.toLowerCase().includes(p))) {
    return false;
  }
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
}

function isValidRpcUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('your') || url.includes('YOUR')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─── ABI (TrustChain Certificate Contract) ──────────────────────────

const CONTRACT_ABI =  
[
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "docId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			}
		],
		"name": "issueCert",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "docId",
				"type": "string"
			}
		],
		"name": "verifyCert",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

// ─── State ────────────────────────────────────────────────────────────

let provider = null;
let wallet = null;
let contract = null;
let blockchainMode = 'mock';
let connectionHealth = {
  lastBlock: null,
  lastChecked: null,
  isHealthy: false,
  error: null
};
let eventListeners = [];

// ─── Validation ─────────────────────────────────────────────────────

const hasValidPrivateKey = isValidPrivateKey(REQUIRED_ENV_VARS.PRIVATE_KEY);
const hasValidContractAddress = isValidContractAddress(REQUIRED_ENV_VARS.CONTRACT_ADDRESS);
const hasRpcUrl = isValidRpcUrl(REQUIRED_ENV_VARS.RPC_URL);

if (!hasValidPrivateKey) {
  console.warn('[xdc] WARNING: PRIVATE_KEY not set or invalid. Blockchain features will use mock mode.');
}
if (!hasValidContractAddress) {
  console.warn('[xdc] WARNING: CONTRACT_ADDRESS not set or invalid. Blockchain features will use mock mode.');
}
if (!hasRpcUrl) {
  console.warn('[xdc] WARNING: RPC_URL not set. Blockchain features will use mock mode.');
}

// ─── Initialization ─────────────────────────────────────────────────

async function initializeBlockchain() {
  if (!hasValidPrivateKey || !hasValidContractAddress || !hasRpcUrl) {
    console.log('[xdc] Blockchain in MOCK mode - documents will be stored locally only');
    return;
  }

  try {
    // StaticJsonRpcProvider skips network detection; XDC Apothem RPC hangs on eth_chainId sometimes
    provider = new ethers.providers.StaticJsonRpcProvider(REQUIRED_ENV_VARS.RPC_URL, {
      chainId: 51,
      name: 'xdc-apothem'
    });
    wallet = new ethers.Wallet(REQUIRED_ENV_VARS.PRIVATE_KEY, provider);
    contract = new ethers.Contract(REQUIRED_ENV_VARS.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Verify connection by fetching network info
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const walletAddress = await wallet.getAddress();

    connectionHealth = {
      lastBlock: blockNumber,
      lastChecked: new Date().toISOString(),
      isHealthy: true,
      error: null
    };

    blockchainMode = 'live';

    console.log('[xdc] Blockchain connection initialized (LIVE mode)');
    console.log(`      Contract: ${REQUIRED_ENV_VARS.CONTRACT_ADDRESS}`);
    console.log(`      RPC: ${REQUIRED_ENV_VARS.RPC_URL}`);
    console.log(`      Network: ${network.name} (chainId: ${network.chainId})`);
    console.log(`      Block: ${blockNumber}`);
    console.log(`      Wallet: ${walletAddress}`);

    // Start health check polling
    startHealthCheck();

    // Setup event listeners
    setupEventListeners();

  } catch (err) {
    console.error('[xdc] Blockchain setup error:', err.message);
    console.warn('[xdc] Falling back to MOCK mode');
    blockchainMode = 'mock';
    connectionHealth.error = err.message;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────

function startHealthCheck() {
  const interval = OPTIONAL_ENV_VARS.BLOCKCHAIN_POLL_INTERVAL;
  setInterval(async () => {
    try {
      if (!provider) return;
      const blockNumber = await provider.getBlockNumber();
      connectionHealth = {
        lastBlock: blockNumber,
        lastChecked: new Date().toISOString(),
        isHealthy: true,
        error: null
      };
    } catch (err) {
      connectionHealth = {
        lastBlock: connectionHealth.lastBlock,
        lastChecked: new Date().toISOString(),
        isHealthy: false,
        error: err.message
      };
      console.warn('[xdc] Health check failed:', err.message);
    }
  }, interval);
}

// ─── Event Listeners ──────────────────────────────────────────────────

function setupEventListeners() {
  if (!contract || blockchainMode !== 'live') return;

  try {
    const onCertIssued = (docId, hash, issuer, timestamp, event) => {
      console.log('[xdc] Event: CertIssued');
      console.log(`      docId: ${docId}`);
      console.log(`      hash: ${hash}`);
      console.log(`      issuer: ${issuer}`);
      console.log(`      timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
      console.log(`      txHash: ${event.transactionHash}`);
    };

    //contract.on('CertIssued', onCertIssued);
    eventListeners.push({ event: 'CertIssued', handler: onCertIssued });

    console.log('[xdc] Event listeners registered for CertIssued');
  } catch (err) {
    console.error('[xdc] Failed to setup event listeners:', err.message);
  }
}

function removeEventListeners() {
  if (!contract) return;
  eventListeners.forEach(({ event, handler }) => {
    contract.off(event, handler);
  });
  eventListeners = [];
  console.log('[xdc] Event listeners removed');
}

// ─── Retry Utility ────────────────────────────────────────────────────

async function withRetry(fn, maxRetries = OPTIONAL_ENV_VARS.BLOCKCHAIN_MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = OPTIONAL_ENV_VARS.BLOCKCHAIN_RETRY_DELAY * attempt;
        console.warn(`[xdc] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─── Core Functions ───────────────────────────────────────────────────

async function issueOnChain(docId, hash) {
  if (!contract || blockchainMode === 'mock') {
    const mockHash = '0xmock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    console.log(`[xdc] [MOCK] Issued document ${docId} with mock tx: ${mockHash}`);
    return mockHash;
  }

  try {
    const tx = await withRetry(() => contract.issueCert(docId, hash));
    console.log(`[xdc] [LIVE] Transaction sent: ${tx.hash}`);

    const receipt = await withRetry(() => tx.wait());
    console.log(`[xdc] [LIVE] Transaction confirmed in block ${receipt.blockNumber}: ${receipt.transactionHash}`);

    return receipt.transactionHash || tx.hash;
  } catch (err) {
    console.error('[xdc] Blockchain issue failed:', err.message);
    throw new Error(`Failed to issue on blockchain: ${err.message}`);
  }
}

async function getHashFromChain(docId) {
  if (!contract || blockchainMode === 'mock') {
    console.log(`[xdc] [MOCK] Retrieved hash for ${docId}: null (mock mode)`);
    return null;
  }

  try {
    const hash = await withRetry(() => contract.verifyCert(docId));
    console.log(`[xdc] [LIVE] Retrieved hash for ${docId}: ${hash || 'not found'}`);
    return hash || null;
  } catch (err) {
    console.error('[xdc] Blockchain verify failed:', err.message);
    return null;
  }
}

async function verifyHashOnChain(docId, hash) {
  if (!contract || blockchainMode === 'mock') {
    console.log(`[xdc] [MOCK] verifyHashOnChain for ${docId}: true (mock mode)`);
    return { exists: true, hash: hash, mock: true };
  }

  try {
    const storedHash = await withRetry(() => contract.verifyCert(docId));
    const exists = storedHash && storedHash.length > 0 && storedHash === hash;
    console.log(`[xdc] [LIVE] verifyHashOnChain for ${docId}: exists=${exists}`);
    return { exists, hash: storedHash || null };
  } catch (err) {
    console.error('[xdc] Blockchain verifyHashOnChain failed:', err.message);
    return { exists: false, hash: null, error: err.message };
  }
}

async function getCertDetails(docId) {
  if (!contract || blockchainMode === 'mock') {
    console.log(`[xdc] [MOCK] getCertDetails for ${docId}: null (mock mode)`);
    return null;
  }

  try {
    const hash = await withRetry(() => contract.verifyCert(docId));
    if (!hash) return null;
    return {
      hash,
      issuer: null,
      timestamp: null,
      exists: hash.length > 0
    };
  } catch (err) {
    console.error('[xdc] getCertDetails failed:', err.message);
    return null;
  }
}

async function getContractOwner() {
  if (!contract || blockchainMode === 'mock') {
    return null;
  }

  try {
    // This contract does not expose an owner() function
    return null;
  } catch (err) {
    console.error('[xdc] getContractOwner failed:', err.message);
    return null;
  }
}

// ─── Wallet Utilities ─────────────────────────────────────────────────

async function getWalletAddress() {
  if (!wallet) return null;
  try {
    return await wallet.getAddress();
  } catch {
    return null;
  }
}

async function getWalletBalance() {
  if (!wallet || !provider) return null;
  try {
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    return {
      address,
      balance: ethers.utils.formatEther(balance),
      balanceWei: balance.toString()
    };
  } catch (err) {
    console.error('[xdc] getWalletBalance failed:', err.message);
    return null;
  }
}

// ─── Status ───────────────────────────────────────────────────────────

function getBlockchainMode() {
  return blockchainMode;
}

function isBlockchainConnected() {
  return blockchainMode === 'live' && contract !== null && connectionHealth.isHealthy;
}

function getConnectionHealth() {
  return { ...connectionHealth };
}

function getContractAddress() {
  return REQUIRED_ENV_VARS.CONTRACT_ADDRESS || null;
}

// ─── Initialize on module load ────────────────────────────────────────

initializeBlockchain();

// ─── Exports ──────────────────────────────────────────────────────────

module.exports = {
  issueOnChain,
  getHashFromChain,
  verifyHashOnChain,
  getCertDetails,
  getContractOwner,
  getWalletAddress,
  getWalletBalance,
  getBlockchainMode,
  isBlockchainConnected,
  getConnectionHealth,
  getContractAddress,
  removeEventListeners
};
