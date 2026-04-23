require('dotenv').config();
const { ethers } = require('ethers');

// Check if environment variables are set
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === '0x0000000000000000000000000000000000000000000000000000000000000000') {
  console.warn('WARNING: PRIVATE_KEY not set. Blockchain features will not work.');
}

if (!process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
  console.warn('WARNING: CONTRACT_ADDRESS not set. Blockchain features will not work.');
}

let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // Only create wallet if private key is valid
  if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }

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

  // Only create contract if address is valid
  if (wallet && process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
  }
} catch (err) {
  console.error('Blockchain setup error:', err.message);
}

async function issueOnChain(docId, hash) {
  if (!contract) {
    console.warn('Blockchain not configured, returning mock tx hash');
    return '0xmock-transaction-hash-' + Date.now();
  }
  
  const tx = await contract.issueCert(docId, hash);
  await tx.wait();
  return tx.hash;
}

async function getHashFromChain(docId) {
  if (!contract) {
    console.warn('Blockchain not configured, returning null');
    return null;
  }
  
  return await contract.verifyCert(docId) || null;
}

module.exports = { issueOnChain, getHashFromChain };