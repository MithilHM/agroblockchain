import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Setting up test environment...");
  
  const [deployer, farmer, distributor, retailer, consumer] = await ethers.getSigners();
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🌾 Farmer: ${farmer.address}`);
  console.log(`🚚 Distributor: ${distributor.address}`);  
  console.log(`🏪 Retailer: ${retailer.address}`);
  console.log(`🛍️ Consumer: ${consumer.address}`);

  // Get deployed contracts
  const supplyChainAddress = process.env.SUPPLY_CHAIN_CONTRACT_ADDRESS;
  const userRegistryAddress = process.env.ACCESS_CONTROL_CONTRACT_ADDRESS;

  if (!supplyChainAddress || !userRegistryAddress) {
    console.error("❌ Contract addresses not found in environment variables");
    console.log("Please deploy contracts first or set CONTRACT_ADDRESS environment variables");
    process.exit(1);
  }

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  
  const supplyChain = SupplyChain.attach(supplyChainAddress);
  const userRegistry = UserRegistry.attach(userRegistryAddress);

  console.log("\n📝 Registering test users...");

  // Register farmer
  await userRegistry.connect(farmer).registerUser(
    "John Doe",
    "john@farm.com", 
    "+1234567890",
    "Farm Valley, State",
    await userRegistry.FARMER_ROLE(),
    "QmFarmerProfileHash123"
  );
  console.log("✅ Farmer registered");

  // Register distributor  
  await userRegistry.connect(distributor).registerUser(
    "Distribution Co",
    "dist@company.com",
    "+1234567891", 
    "City Center, State",
    await userRegistry.DISTRIBUTOR_ROLE(),
    "QmDistributorProfileHash456"
  );
  console.log("✅ Distributor registered");

  // Register retailer
  await userRegistry.connect(retailer).registerUser(
    "Fresh Market",
    "retail@market.com",
    "+1234567892",
    "Market Street, City", 
    await userRegistry.RETAILER_ROLE(),
    "QmRetailerProfileHash789"
  );
  console.log("✅ Retailer registered");

  console.log("\n🎯 Granting roles in SupplyChain contract...");

  // Grant roles in SupplyChain contract
  await supplyChain.grantUserRole(await supplyChain.FARMER_ROLE(), farmer.address);
  await supplyChain.grantUserRole(await supplyChain.DISTRIBUTOR_ROLE(), distributor.address);
  await supplyChain.grantUserRole(await supplyChain.RETAILER_ROLE(), retailer.address);
  
  console.log("✅ All roles granted");

  console.log("\n🌱 Creating sample batch...");

  // Create sample batch
  const batchId = `BATCH_${Date.now()}`;
  const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  
  await supplyChain.connect(farmer).registerBatch(
    batchId,
    "Organic Tomatoes",
    "Cherry Tomatoes",
    1000, // 1000 kg
    "Farm Valley Organic Farm",
    ethers.parseEther("0.01"), // 0.01 ETH per kg
    expiryDate,
    "QmCertificationHash123",
    "QmImageHash456", 
    true // isOrganic
  );

  console.log(`✅ Sample batch created: ${batchId}`);

  console.log("\n📦 Transferring batch through supply chain...");

  // Update status to harvested
  await supplyChain.connect(farmer).updateBatchStatus(batchId, 1); // Harvested
  console.log("✅ Batch marked as harvested");

  // Transfer to distributor
  await supplyChain.connect(farmer).transferBatch(
    batchId,
    distributor.address,
    ethers.parseEther("0.012"), // 0.012 ETH per kg
    "Farm Valley Warehouse",
    "Transfer to distributor for regional distribution"
  );
  console.log("✅ Batch transferred to distributor");

  // Update status to in transit
  await supplyChain.connect(distributor).updateBatchStatus(batchId, 3); // InTransit
  console.log("✅ Batch marked as in transit");

  // Transfer to retailer
  await supplyChain.connect(distributor).transferBatch(
    batchId,
    retailer.address, 
    ethers.parseEther("0.015"), // 0.015 ETH per kg
    "Fresh Market Store",
    "Final transfer to retail store"
  );
  console.log("✅ Batch transferred to retailer");

  // Update status to delivered
  await supplyChain.connect(retailer).updateBatchStatus(batchId, 4); // Delivered
  console.log("✅ Batch marked as delivered");

  console.log("\n🔍 Adding quality check...");

  // Add quality check (using deployer as regulator)
  await supplyChain.addQualityCheck(
    batchId,
    85, // Quality score
    "Excellent quality produce, meets all organic standards",
    "QmQualityReportHash789"
  );
  console.log("✅ Quality check added");

  console.log("\n📊 Test environment setup complete!");
  console.log(`🆔 Sample Batch ID: ${batchId}`);
  console.log("\n🔗 You can now test the following operations:");
  console.log("- Get batch details");
  console.log("- View transfer history"); 
  console.log("- Check quality reports");
  console.log("- Mark as sold to consumer");
  
  // Display batch info
  const batch = await supplyChain.getBatch(batchId);
  console.log("\n📋 Current Batch Status:");
  console.log(`- Produce: ${batch.produceType} (${batch.variety})`);
  console.log(`- Quantity: ${batch.quantity} kg`);
  console.log(`- Current Owner: ${batch.currentOwner}`);
  console.log(`- Current Price: ${ethers.formatEther(batch.currentPrice)} ETH per kg`);
  console.log(`- Status: ${batch.status}`);
  console.log(`- Organic: ${batch.isOrganic}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });