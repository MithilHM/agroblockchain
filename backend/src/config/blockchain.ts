import { ethers } from 'ethers';
import { config } from './env';
import SupplyChainABI from '../contracts/SupplyChain.json';

export class BlockchainConfig {
  public provider: ethers.JsonRpcProvider;
  public contract: ethers.Contract;
  public wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.blockchain.contractAddress,
      SupplyChainABI.abi,
      this.wallet
    );
  }

  async getContractWithSigner(): Promise<ethers.Contract> {
    return this.contract.connect(this.wallet);
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async estimateGas(transaction: any): Promise<bigint> {
    return await this.provider.estimateGas(transaction);
  }
}

export const blockchainConfig = new BlockchainConfig();
export default blockchainConfig;