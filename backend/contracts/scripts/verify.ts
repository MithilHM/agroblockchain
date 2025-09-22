import { run } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentInfo {
  contracts: {
    SupplyChain: { address: string };
    UserRegistry: { address: string };
  };
  network: string;
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  
  console.log(`🔍 Verifying contracts on ${network}...`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestPath = path.join(deploymentsDir, `latest-${network}.json`);
  
  if (!fs.existsSync(latestPath)) {
    console.error(`❌ No deployment found for network: ${network}`);
    console.log(`Looking for: ${latestPath}`);
    process.exit(1);
  }

  const deploymentInfo: DeploymentInfo = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

  try {
    // Verify UserRegistry
    console.log("\n📄 Verifying UserRegistry...");
    await run("verify:verify", {
      address: deploymentInfo.contracts.UserRegistry.address,
      constructorArguments: [],
    });
    console.log("✅ UserRegistry verified");

    // Verify SupplyChain
    console.log("\n📄 Verifying SupplyChain...");
    await run("verify:verify", {
      address: deploymentInfo.contracts.SupplyChain.address,
      constructorArguments: [],
    });
    console.log("✅ SupplyChain verified");

    console.log("\n🎉 All contracts verified successfully!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
    
    // Check if contracts are already verified
    if (error?.toString().includes("Already Verified")) {
      console.log("✅ Contracts are already verified");
    } else {
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });