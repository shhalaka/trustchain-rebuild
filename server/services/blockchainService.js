const {
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
  getContractAddress
} = require('../utils/xdc');

/**
 * Blockchain Service Layer
 * Wraps low-level blockchain utilities with business logic,
 * validation, and structured responses.
 */

class BlockchainService {
  /**
   * Issue a document certificate on the blockchain.
   * Hashes the document buffer with SHA-256, then calls contract.issue(hash).
   * @param {string} docId - Unique document ID (e.g., TC-1234567890123)
   * @param {Buffer} fileBuffer - Raw document file buffer
   * @returns {Promise<Object>} - Transaction result with hash and txHash
   */
  static async issueCertificate(docId, fileBuffer) {
    if (!docId || typeof docId !== 'string') {
      throw new Error('Invalid docId: must be a non-empty string');
    }
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('Invalid fileBuffer: must be a Buffer');
    }

    // 1. SHA-256 hash of the document
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Call smart contract issue(hash)
    const txHash = await issueOnChain(docId, hash);

    return {
      success: true,
      docId,
      hash,
      txHash,
      mode: getBlockchainMode(),
      verifiedOnChain: isBlockchainConnected()
    };
  }

  /**
   * Verify a document by retrieving its stored hash from the blockchain.
   * @param {string} docId - Unique document ID
   * @returns {Promise<Object>} - Verification data
   */
  static async verifyCertificate(docId) {
    if (!docId || typeof docId !== 'string') {
      throw new Error('Invalid docId: must be a non-empty string');
    }

    const storedHash = await getHashFromChain(docId);
    const details = await getCertDetails(docId);

    return {
      success: true,
      docId,
      storedHash,
      details,
      mode: getBlockchainMode(),
      onChain: storedHash !== null
    };
  }

  /**
   * Verify a document hash against the blockchain.
   * Calls contract.verifyCert(docId) and compares with the computed hash.
   * @param {string} docId - Unique document ID
   * @param {string} hash - SHA-256 hash to verify
   * @returns {Promise<Object>} - Verification result with exists boolean
   */
  static async verifyHash(docId, hash) {
    if (!docId || typeof docId !== 'string') {
      throw new Error('Invalid docId: must be a non-empty string');
    }
    if (!hash || typeof hash !== 'string') {
      throw new Error('Invalid hash: must be a non-empty string');
    }

    const result = await verifyHashOnChain(docId, hash);

    return {
      success: true,
      docId,
      hash,
      exists: result.exists,
      storedHash: result.hash,
      mode: getBlockchainMode(),
      onChain: result.hash !== null
    };
  }

  /**
   * Get full certificate details from the smart contract.
   * @param {string} docId - Unique document ID
   * @returns {Promise<Object|null>} - Certificate details or null
   */
  static async getCertificateDetails(docId) {
    if (!docId || typeof docId !== 'string') {
      throw new Error('Invalid docId: must be a non-empty string');
    }

    const details = await getCertDetails(docId);
    if (!details) {
      return null;
    }

    return {
      docId,
      hash: details.hash,
      issuer: details.issuer,
      timestamp: details.timestamp,
      exists: details.exists,
      dateIssued: details.timestamp ? new Date(details.timestamp * 1000).toISOString() : null,
      mode: getBlockchainMode()
    };
  }

  /**
   * Get the current status of the blockchain connection.
   * @returns {Object} - Connection status
   */
  static getStatus() {
    const health = getConnectionHealth();
    return {
      mode: getBlockchainMode(),
      connected: isBlockchainConnected(),
      contractAddress: getContractAddress(),
      health,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get wallet information (address and balance).
   * @returns {Promise<Object|null>} - Wallet info or null
   */
  static async getWalletInfo() {
    const address = await getWalletAddress();
    const balanceData = await getWalletBalance();

    if (!address) {
      return null;
    }

    return {
      address,
      balance: balanceData?.balance || '0',
      balanceWei: balanceData?.balanceWei || '0',
      mode: getBlockchainMode()
    };
  }

  /**
   * Get the owner address of the deployed contract.
   * @returns {Promise<string|null>} - Owner address or null
   */
  static async getContractOwner() {
    return await getContractOwner();
  }

  /**
   * Check if the service is in live mode and healthy.
   * @returns {boolean}
   */
  static isHealthy() {
    return isBlockchainConnected();
  }
}

module.exports = BlockchainService;
