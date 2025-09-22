"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainConfig = exports.BlockchainConfig = void 0;
const ethers_1 = require("ethers");
const env_1 = require("./env");
const SupplyChain_json_1 = __importDefault(require("../contracts/SupplyChain.json"));
class BlockchainConfig {
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(env_1.config.blockchain.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(env_1.config.blockchain.privateKey, this.provider);
        this.contract = new ethers_1.ethers.Contract(env_1.config.blockchain.contractAddress, SupplyChain_json_1.default.abi, this.wallet);
    }
    async getContractWithSigner() {
        return this.contract.connect(this.wallet);
    }
    async getBlockNumber() {
        return await this.provider.getBlockNumber();
    }
    async getBalance(address) {
        const balance = await this.provider.getBalance(address);
        return ethers_1.ethers.formatEther(balance);
    }
    async estimateGas(transaction) {
        return await this.provider.estimateGas(transaction);
    }
}
exports.BlockchainConfig = BlockchainConfig;
exports.blockchainConfig = new BlockchainConfig();
exports.default = exports.blockchainConfig;
//# sourceMappingURL=blockchain.js.map