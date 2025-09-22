import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import SupplyChainABI from './SupplyChain.json';

// --- Environment Variable Checks ---
if (!process.env.BLOCKCHAIN_PROVIDER_URL) {
  logger.error('BLOCKCHAIN_PROVIDER_URL is not defined in environment variables.');
  throw new Error('Missing environment variable: BLOCKCHAIN_PROVIDER_URL');
}

if (!process.env.CONTRACT_ADDRESS) {
  logger.error('CONTRACT_ADDRESS is not defined in environment variables.');
  throw new Error('Missing environment variable: CONTRACT_ADDRESS');
}

if (!process.env.BACKEND_WALLET_PRIVATE_KEY) {
  logger.error('BACKEND_WALLET_PRIVATE_KEY is not defined in environment variables.');
  throw new Error('Missing environment variable: BACKEND_WALLET_PRIVATE_KEY');
}

// --- Configuration ---
const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
const contractAbi = SupplyChainABI.abi;

/**
 * Sets up a connection to the blockchain provider.
 * A "Provider" is a read-only connection to the blockchain, which allows querying blockchain state.
 */
const provider = new ethers.JsonRpcProvider(providerUrl);

/**
 * Creates a "Signer" instance.
 * A "Signer" or "Wallet" is an object that can sign transactions and messages.
 * We use the backend's wallet private key here, which will pay the gas fees
 * for transactions like registering a batch or transferring ownership.
 */
const signer = new ethers.Wallet(privateKey, provider);

/**
 * Creates an instance of the SupplyChain contract.
 * This contract instance is connected to our signer, meaning any "write" operations
 * (functions that change the blockchain state) will be signed by our backend wallet.
 */
const supplyChainContract = new ethers.Contract(
  contractAddress,
  contractAbi,
  signer
);

logger.info(`Successfully connected to blockchain provider at ${providerUrl}`);
logger.info(`SupplyChain contract instance created for address ${contractAddress}`);

// Export the contract instance to be used across the application
export default supplyChainContract;
