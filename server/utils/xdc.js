require('dotenv').config();
const { ethers } = require('ethers');

// Validate private key format
function isValidPrivateKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  // Check for placeholder values
  const placeholders = [
    'your-private-key-here',
    'your_private_key_here',
    'YOUR_PRIVATE_KEY',
    'private_key_here',
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  ];
  
  if (placeholders.includes(key) || placeholders.some(p => key.toLowerCase().includes(p))) {
    return false;
  }
  
  // Check if it's a valid hex string of correct length (32 bytes = 64 hex chars + 0x prefix)
  const hexRegex = /^0x[a-fA-F0-9]{64}$/;
  return hexRegex.test(key);
}

// Validate contract address
function isValidContractAddress(address) {
  if (!address || typeof address !== 'string') return false;
  
  // Check for placeholder values
  const placeholders = [
    'your-contract-address-here',
    'your_contract_address_here',
    'YOUR_CONTRACT_ADDRESS',
    '0x0000000000000000000000000000000000000000'
  ];
  
  if (placeholders.includes(address) || placeholders.some(p => address.toLowerCase().includes(p))) {
    return false;
  }
  
  // Check if it's a valid Ethereum address
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

// Check environment variables
const hasValidPrivateKey = isValidPrivateKey(process.env.PRIVATE_KEY);
const hasValidContractAddress = isValidContractAddress(process.env.CONTRACT_ADDRESS);
const hasRpcUrl = process.env.RPC_URL && !process.env.RPC_URL.includes('your') && !process.env.RPC_URL.includes('YOUR');

if (!hasValidPrivateKey) {
  console.warn('⚠️  WARNING: PRIVATE_KEY not set or invalid. Blockchain features will use mock mode.');
}

if (!hasValidContractAddress) {
  console.warn('⚠️  WARNING: CONTRACT_ADDRESS not set or invalid. Blockchain features will use mock mode.');
}

if (!hasRpcUrl) {
  console.warn('⚠️  WARNING: RPC_URL not set. Blockchain features will use mock mode.');
}

let provider = null;
let wallet = null;
let contract = null;
let blockchainMode = 'mock'; // 'mock' or 'live'

// Only initialize blockchain connection if all env vars are valid
if (hasValidPrivateKey && hasValidContractAddress && hasRpcUrl) {
  try {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const abi = [
      {
        "inputs": [
          { "internalType": "string", "name": "docId", "type": "string" },
          { "internalType": "string", "name": "hash", "type": "string" }
        ],
        "name": "issueCert",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "docId", "type": "string" }
        ],
        "name": "verifyCert",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
    blockchainMode = 'live';
    
    console.log('✅ Blockchain connection initialized (LIVE mode)');
    console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`   RPC: ${process.env.RPC_URL}`);
  } catch (err) {
    console.error('❌ Blockchain setup error:', err.message);
    console.warn('   Falling back to MOCK mode');
    blockchainMode = 'mock';
  }
} else {
  console.log('ℹ️  Blockchain in MOCK mode - documents will be stored locally only');
}

async function issueOnChain(docId, hash) {
  if (!contract || blockchainMode === 'mock') {
    const mockHash = '0xmock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    console.log(`[MOCK] Issued document ${docId} with mock tx: ${mockHash}`);
    return mockHash;
  }
  
  try {
    const tx = await contract.issueCert(docId, hash);
    console.log(`[LIVE] Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`[LIVE] Transaction confirmed: ${receipt.hash}`);
    
    return receipt.hash || tx.hash;
  } catch (err) {
    console.error('❌ Blockchain issue failed:', err.message);
    throw new Error(`Failed to issue on blockchain: ${err.message}`);
  }
}

async function getHashFromChain(docId) {
  if (!contract || blockchainMode === 'mock') {
    console.log(`[MOCK] Retrieved hash for ${docId}: null (mock mode)`);
    return null;
  }
  
  try {
    const hash = await contract.verifyCert(docId);
    console.log(`[LIVE] Retrieved hash for ${docId}: ${hash}`);
    return hash || null;
  } catch (err) {
    console.error('❌ Blockchain verify failed:', err.message);
    return null; // Return null instead of throwing - allows fallback to ZK proof
  }
}

function getBlockchainMode() {
  return blockchainMode;
}

function isBlockchainConnected() {
  return blockchainMode === 'live' && contract !== null;
}

module.exports = { 
  issueOnChain, 
  getHashFromChain,
  getBlockchainMode,
  isBlockchainConnected
};