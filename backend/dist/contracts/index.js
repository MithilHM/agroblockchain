"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const logger_1 = require("../utils/logger");
const SupplyChain_json_1 = __importDefault(require("./SupplyChain.json"));
// --- Environment Variable Checks ---
if (!process.env.BLOCKCHAIN_PROVIDER_URL) {
    logger_1.logger.error('BLOCKCHAIN_PROVIDER_URL is not defined in environment variables.');
    throw new Error('Missing environment variable: BLOCKCHAIN_PROVIDER_URL');
}
if (!process.env.CONTRACT_ADDRESS) {
    logger_1.logger.error('CONTRACT_ADDRESS is not defined in environment variables.');
    throw new Error('Missing environment variable: CONTRACT_ADDRESS');
}
if (!process.env.BACKEND_WALLET_PRIVATE_KEY) {
    logger_1.logger.error('BACKEND_WALLET_PRIVATE_KEY is not defined in environment variables.');
    throw new Error('Missing environment variable: BACKEND_WALLET_PRIVATE_KEY');
}
// --- Configuration ---
const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
const contractAbi = SupplyChain_json_1.default.abi;
/**
 * Sets up a connection to the blockchain provider.
 * A "Provider" is a read-only connection to the blockchain, which allows querying blockchain state.
 */
const provider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
/**
 * Creates a "Signer" instance.
 * A "Signer" or "Wallet" is an object that can sign transactions and messages.
 * We use the backend's wallet private key here, which will pay the gas fees
 * for transactions like registering a batch or transferring ownership.
 */
const signer = new ethers_1.ethers.Wallet(privateKey, provider);
/**
 * Creates an instance of the SupplyChain contract.
 * This contract instance is connected to our signer, meaning any "write" operations
 * (functions that change the blockchain state) will be signed by our backend wallet.
 */
const supplyChainContract = new ethers_1.ethers.Contract(contractAddress, contractAbi, signer);
logger_1.logger.info(`Successfully connected to blockchain provider at ${providerUrl}`);
logger_1.logger.info(`SupplyChain contract instance created for address ${contractAddress}`);
// Export the contract instance to be used across the application
exports.default = supplyChainContract;
