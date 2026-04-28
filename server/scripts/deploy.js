require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * XDC Apothem Smart Contract Deployment Script
 *
 * Usage:
 *   1. Ensure your contract is compiled and the ABI/bytecode are available.
 *   2. Set PRIVATE_KEY and RPC_URL in your .env file.
 *   3. Run: node scripts/deploy.js
 *
 * This script deploys the TrustChain Certificate contract to XDC Apothem.
 */

const RPC_URL = process.env.RPC_URL || 'https://rpc.apothem.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY is required. Set it in your .env file.');
  process.exit(1);
}

// ─── Contract ABI & Bytecode ────────────────────────────────────────
// Replace these with your actual compiled contract artifacts.
// You can generate them with Hardhat, Truffle, or Remix.

const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "docId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "hash", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "issuer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "CertIssued",
    "type": "event"
  },
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
  },
  {
    "inputs": [
      { "internalType": "string", "name": "docId", "type": "string" }
    ],
    "name": "getCertDetails",
    "outputs": [
      { "internalType": "string", "name": "hash", "type": "string" },
      { "internalType": "address", "name": "issuer", "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool", "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// NOTE: Replace this with your actual compiled contract bytecode.
const CONTRACT_BYTECODE = '0x6080604052...'; // <-- REPLACE THIS

// ─── Deployment ─────────────────────────────────────────────────────

async function deploy() {
  console.log('🚀 Starting deployment to XDC Apothem...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const deployerAddress = await wallet.getAddress();
  console.log(`👤 Deployer: ${deployerAddress}`);

  const balance = await provider.getBalance(deployerAddress);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} XDC\n`);

  if (balance === 0n) {
    console.error('❌ Insufficient balance. Get XDC from https://faucet.apothem.network');
    process.exit(1);
  }

  console.log('📄 Deploying TrustChain Certificate Contract...');

  const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
  const contract = await factory.deploy();

  console.log(`⏳ Transaction: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...');

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n✅ Contract deployed at: ${contractAddress}`);
  console.log(`   Network: XDC Apothem`);
  console.log(`   RPC: ${RPC_URL}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployerAddress,
    network: 'XDC Apothem',
    rpcUrl: RPC_URL,
    deployedAt: new Date().toISOString(),
    abi: CONTRACT_ABI
  };

  const deployDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const deployFile = path.join(deployDir, 'apothem.json');
  fs.writeFileSync(deployFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📝 Deployment info saved to: ${deployFile}`);

  console.log('\n⚠️  IMPORTANT:');
  console.log(`   Add CONTRACT_ADDRESS=${contractAddress} to your .env file`);

  // Verify initial state
  const owner = await contract.owner();
  console.log(`\n🔍 Contract owner: ${owner}`);
}

deploy().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
