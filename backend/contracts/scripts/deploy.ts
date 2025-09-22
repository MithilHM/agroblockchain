import { ethers } from "hardhat";
import { Contract } from "ethers";
import fs from "fs";
import path from "path";

interface DeploymentResult {
  supplyChain: Contract;
  userRegistry: Contract;
  network: string;
  deployer: string;
  gasUsed: {
    supplyChain: bigint;
    userRegistry: bigint;
    total: bigint;
  };
}

async function main(): Promise<void> {
  console.log("🚀 Starting deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error("❌ Deployer has no funds!");
    process.exit(1);
  }

  let totalGasUsed = 0n;
  
  try {
    // Deploy UserRegistry first
    console.log("\n📄 Deploying UserRegistry...");
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    const userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
    
    const userRegistryAddress = await userRegistry.getAddress();
    const userRegistryReceipt = await ethers.provider.getTransactionReceipt(
      userRegistry.deploymentTransaction()?.hash!
    );
    const userRegistryGasUsed = userRegistryReceipt?.gasUsed || 0n;
    totalGasUsed += userRegistryGasUsed;
    
    console.log(`✅ UserRegistry deployed to: ${userRegistryAddress}`);
    console.log(`⛽ Gas used: ${userRegistryGasUsed.toString()}`);

    // Deploy SupplyChain contract
    console.log("\n📄 Deploying SupplyChain...");
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();
    
    const supplyChainAddress = await supplyChain.getAddress();
    const supplyChainReceipt = await ethers.provider.getTransactionReceipt(
      supplyChain.deploymentTransaction()?.hash!
    );
    const supplyChainGasUsed = supplyChainReceipt?.gasUsed || 0n;
    totalGasUsed += supplyChainGasUsed;
    
    console.log(`✅ SupplyChain deployed to: ${supplyChainAddress}`);
    console.log(`⛽ Gas used: ${supplyChainGasUsed.toString()}`);

    // Setup initial roles and permissions
    console.log("\n🔐 Setting up initial roles...");
    
    // Grant REGULATOR_ROLE to deployer in SupplyChain if not already granted
    const REGULATOR_ROLE = await supplyChain.REGULATOR_ROLE();
    const hasRegulatorRole = await supplyChain.hasRole(REGULATOR_ROLE, deployer.address);
    
    if (!hasRegulatorRole) {
      const grantRoleTx = await supplyChain.grantUserRole(REGULATOR_ROLE, deployer.address);
      await grantRoleTx.wait();
      console.log("✅ Granted REGULATOR_ROLE to deployer");
    }

    // Prepare deployment result
    const deploymentResult: DeploymentResult = {
      supplyChain,
      userRegistry,
      network: network.name,
      deployer: deployer.address,
      gasUsed: {
        supplyChain: supplyChainGasUsed,
        userRegistry: userRegistryGasUsed,
        total: totalGasUsed
      }
    };

    // Save deployment info
    await saveDeploymentInfo(deploymentResult);
    
    // Update backend contract JSON
    await updateBackendContractFile(supplyChainAddress, supplyChain);

    console.log("\n🎉 Deployment completed successfully!");
    console.log(`📊 Total gas used: ${totalGasUsed.toString()}`);
    console.log(`💸 Total cost: ~${ethers.formatEther(totalGasUsed * 20000000000n)} ETH (estimated at 20 gwei)`);
    
    // Verify contracts if on public network
    if (network.chainId !== 1337n && network.chainId !== 31337n) {
      console.log("\n🔍 Contract verification info:");
      console.log(`UserRegistry: npx hardhat verify --network ${network.name} ${userRegistryAddress}`);
      console.log(`SupplyChain: npx hardhat verify --network ${network.name} ${supplyChainAddress}`);
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function saveDeploymentInfo(result: DeploymentResult): Promise<void> {
  const deploymentInfo = {
    network: result.network,
    deployer: result.deployer,
    timestamp: new Date().toISOString(),
    contracts: {
      SupplyChain: {
        address: await result.supplyChain.getAddress(),
        gasUsed: result.gasUsed.supplyChain.toString()
      },
      UserRegistry: {
        address: await result.userRegistry.getAddress(),
        gasUsed: result.gasUsed.userRegistry.toString()
      }
    },
    totalGasUsed: result.gasUsed.total.toString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const fileName = `deployment-${result.network}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${filePath}`);

  // Also save as latest deployment
  const latestPath = path.join(deploymentsDir, `latest-${result.network}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
}

async function updateBackendContractFile(contractAddress: string, contract: Contract): Promise<void> {
  try {
    // Get the contract ABI
    const contractInterface = contract.interface;
    const abi = contractInterface.formatJson();

    const contractInfo = {
      address: contractAddress,
      abi: JSON.parse(abi),
      deployedAt: new Date().toISOString()
    };

    // Path to backend contracts folder
    const backendContractsPath = path.join(__dirname, "../../backend/src/contracts/SupplyChain.json");
    
    fs.writeFileSync(backendContractsPath, JSON.stringify(contractInfo, null, 2));
    console.log(`📄 Updated backend contract file: ${backendContractsPath}`);
  } catch (error) {
    console.warn("⚠️ Could not update backend contract file:", error);
  }
}

// Export for programmatic use
export { main as deployContracts, DeploymentResult };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}