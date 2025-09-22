import { ethers } from 'ethers';
export declare class BlockchainConfig {
    provider: ethers.JsonRpcProvider;
    contract: ethers.Contract;
    wallet: ethers.Wallet;
    constructor();
    getContractWithSigner(): Promise<ethers.Contract>;
    getBlockNumber(): Promise<number>;
    getBalance(address: string): Promise<string>;
    estimateGas(transaction: any): Promise<bigint>;
}
export declare const blockchainConfig: BlockchainConfig;
export default blockchainConfig;
//# sourceMappingURL=blockchain.d.ts.map