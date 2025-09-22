# Contracts

This folder contains all the smart contracts for the Agricultural Supply Chain Transparency Platform.

## 📁 Structure

```
contracts/
├── src/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── SupplyChain.sol # Main supply chain contract
│   │   └── UserRegistry.sol # User management contract
│   └── interfaces/         # Contract interfaces
│       └── ISupplyChain.sol
├── scripts/                # Deployment and utility scripts
│   ├── deploy.ts          # Main deployment script
│   ├── setup-test-data.ts # Test data setup
│   └── verify.ts          # Contract verification
├── test/                   # Test files
│   ├── SupplyChain.test.ts
│   └── UserRegistry.test.ts
├── deployments/           # Deployment artifacts (generated)
├── hardhat.config.ts      # Hardhat configuration
├── package.json          # Dependencies
└── .env.example          # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Deploy to Local Network

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy:local
```

## 📋 Smart Contracts

### SupplyChain.sol

The main contract that handles:
- **Batch Registration**: Farmers can register new produce batches
- **Ownership Transfer**: Transfer batches through the supply chain
- **Status Updates**: Track batch status (registered, harvested, in-transit, etc.)
- **Quality Checks**: Regulators can add quality inspection reports
- **Price Management**: Update prices at each stage
- **Traceability**: Complete history of all transactions and transfers

**Key Features:**
- Role-based access control (Farmer, Distributor, Retailer, Regulator)
- Event logging for all major actions
- IPFS integration for certificates and images
- Quality scoring system
- Expiration date tracking
- Organic certification support

### UserRegistry.sol

Manages user registration and roles:
- **User Registration**: Self-registration with role assignment
- **Profile Management**: Update user profiles
- **Role Management**: Admin can update user roles
- **Account Status**: Activate/deactivate user accounts
- **Role Queries**: Get users by role

## 🔧 Available Scripts

- `npm run compile` - Compile all contracts
- `npm run deploy:local` - Deploy to local Hardhat network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:polygon` - Deploy to Polygon mainnet
- `npm test` - Run all tests
- `npm run coverage` - Generate test coverage report
- `npm run verify` - Verify deployed contracts
- `npm run node` - Start local Hardhat node

## 🌐 Network Configuration

The contracts support deployment to multiple networks:

- **Local/Hardhat**: For development and testing
- **Sepolia**: Ethereum testnet
- **Polygon**: Polygon mainnet (low fees)
- **Mumbai**: Polygon testnet

## 🔑 Roles and Permissions

### DEFAULT_ADMIN_ROLE
- Can grant/revoke roles
- Can pause/unpause contracts
- Full administrative control

### FARMER_ROLE
- Register new batches
- Update batch status to "Harvested"
- Transfer ownership of their batches
- Update prices for their batches

### DISTRIBUTOR_ROLE
- Update batch status to "InTransit" or "Delivered"
- Transfer ownership (when they own the batch)
- Update prices for owned batches

### RETAILER_ROLE
- Update batch status to "Sold"
- Transfer ownership (when they own the batch)
- Update prices for owned batches

### REGULATOR_ROLE
- Add quality checks to any batch
- View all batch information
- Inspect complete supply chain history

## 📊 Events

All major contract interactions emit events for easy tracking:

- `BatchRegistered` - New batch created
- `BatchTransferred` - Ownership changed
- `BatchStatusUpdated` - Status changed
- `QualityCheckAdded` - Quality inspection added
- `PriceUpdated` - Price changed
- `BatchSold` - Final sale to consumer

## 🔐 Security Features

- **Access Control**: Role-based permissions using OpenZeppelin's AccessControl
- **Reentrancy Protection**: ReentrancyGuard prevents reentrancy attacks
- **Pausable**: Admin can pause contract in emergencies
- **Input Validation**: Comprehensive validation of all inputs
- **Safe Math**: Uses Solidity 0.8+ built-in overflow protection

## 📈 Gas Optimization

- Efficient storage patterns
- Event-based logging over storage when possible
- Optimized contract size
- Minimal external calls

## 🧪 Testing

Comprehensive test suite covering:
- Contract deployment
- Role-based access control
- Batch lifecycle management
- Transfer functionality
- Quality check system
- Price updates
- Error conditions
- Edge cases

Run tests with coverage:
```bash
npm run coverage
```

## 🚀 Deployment

### Environment Variables Required

```env
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Deployment Process

1. **Compile contracts**
2. **Deploy UserRegistry**
3. **Deploy SupplyChain**
4. **Setup initial roles**
5. **Update backend configuration**
6. **Verify contracts (if on public network)**

The deployment script automatically:
- Deploys both contracts
- Sets up initial roles
- Updates the backend contract configuration
- Saves deployment info for future reference

## 🔍 Contract Verification

After deployment to public networks, verify contracts:

```bash
npm run verify
```

This enables source code viewing on block explorers like Etherscan.

## 📱 Integration with Backend

The contracts integrate with the Node.js backend through:
- **ABI files**: Generated during compilation
- **Contract addresses**: Saved in deployment artifacts
- **Type definitions**: TypeScript types for contract interaction

The deployment script automatically updates the backend's contract configuration file.

## 🔄 Upgrade Strategy

Current contracts are not upgradeable by design for security and immutability. For updates:
1. Deploy new contract versions
2. Migrate data if necessary
3. Update backend configuration
4. Coordinate with frontend applications

## 🆘 Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Ensure deployer has enough ETH
2. **"Nonce too high"**: Reset account nonce in MetaMask
3. **"Contract not verified"**: Run verification script after deployment
4. **"Role not granted"**: Check role assignments in deployment

### Getting Help

- Check Hardhat documentation
- Review contract events for transaction details
- Use block explorer to verify transactions
- Check deployment logs in `/deployments` folder

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Development](https://ethereum.org/developers)
- [Solidity Documentation](https://docs.soliditylang.org)