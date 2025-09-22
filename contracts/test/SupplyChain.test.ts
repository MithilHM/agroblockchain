import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SupplyChain", function () {
  let supplyChain: Contract;
  let userRegistry: Contract;
  let deployer: Signer;
  let farmer: Signer;
  let distributor: Signer;
  let retailer: Signer;
  let regulator: Signer;
  let consumer: Signer;

  let deployerAddress: string;
  let farmerAddress: string;
  let distributorAddress: string;
  let retailerAddress: string;
  let regulatorAddress: string;
  let consumerAddress: string;

  const BATCH_ID = "BATCH_TEST_001";
  const PRODUCE_TYPE = "Organic Tomatoes";
  const VARIETY = "Cherry Tomatoes";
  const QUANTITY = 1000; // 1000 kg
  const ORIGIN = "Test Farm Valley";
  const BASE_PRICE = ethers.parseEther("0.01"); // 0.01 ETH per kg
  const CERTIFICATION_HASH = "QmTestCertificationHash123";
  const IMAGE_HASH = "QmTestImageHash456";

  beforeEach(async function () {
    // Get signers
    [deployer, farmer, distributor, retailer, regulator, consumer] = await ethers.getSigners();
    
    // Get addresses
    deployerAddress = await deployer.getAddress();
    farmerAddress = await farmer.getAddress();
    distributorAddress = await distributor.getAddress();
    retailerAddress = await retailer.getAddress();
    regulatorAddress = await regulator.getAddress();
    consumerAddress = await consumer.getAddress();

    // Deploy UserRegistry
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();

    // Deploy SupplyChain
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    // Setup roles
    const FARMER_ROLE = await supplyChain.FARMER_ROLE();
    const DISTRIBUTOR_ROLE = await supplyChain.DISTRIBUTOR_ROLE();
    const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();
    const REGULATOR_ROLE = await supplyChain.REGULATOR_ROLE();

    await supplyChain.grantUserRole(FARMER_ROLE, farmerAddress);
    await supplyChain.grantUserRole(DISTRIBUTOR_ROLE, distributorAddress);
    await supplyChain.grantUserRole(RETAILER_ROLE, retailerAddress);
    await supplyChain.grantUserRole(REGULATOR_ROLE, regulatorAddress);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const DEFAULT_ADMIN_ROLE = await supplyChain.DEFAULT_ADMIN_ROLE();
      expect(await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress)).to.be.true;
    });

    it("Should set the correct initial state", async function () {
      expect(await supplyChain.getTotalBatches()).to.equal(0);
      const allBatchIds = await supplyChain.getAllBatchIds();
      expect(allBatchIds.length).to.equal(0);
    });
  });

  describe("Batch Registration", function () {
    it("Should register a new batch successfully", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.emit(supplyChain, "BatchRegistered")
        .withArgs(BATCH_ID, farmerAddress, PRODUCE_TYPE, QUANTITY, ORIGIN);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.batchId).to.equal(BATCH_ID);
      expect(batch.produceType).to.equal(PRODUCE_TYPE);
      expect(batch.farmer).to.equal(farmerAddress);
      expect(batch.currentOwner).to.equal(farmerAddress);
      expect(batch.basePrice).to.equal(BASE_PRICE);
      expect(batch.isOrganic).to.be.true;
    });

    it("Should fail to register batch with invalid parameters", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      // Empty batch ID
      await expect(
        supplyChain.connect(farmer).registerBatch(
          "",
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Batch ID cannot be empty");

      // Zero quantity
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          0,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Quantity must be greater than 0");

      // Zero price
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          0,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Price must be greater than 0");

      // Past expiry date
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          pastDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Expiry date must be in the future");
    });

    it("Should fail if not called by farmer", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      await expect(
        supplyChain.connect(distributor).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.reverted;
    });

    it("Should fail to register duplicate batch", async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      // Register first batch
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );

      // Try to register same batch again
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Batch already exists");
    });
  });

  describe("Batch Transfer", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should transfer batch successfully", async function () {
      const transferPrice = ethers.parseEther("0.012");
      const location = "Warehouse A";
      const remarks = "Transfer to distributor";

      await expect(
        supplyChain.connect(farmer).transferBatch(
          BATCH_ID,
          distributorAddress,
          transferPrice,
          location,
          remarks
        )
      ).to.emit(supplyChain, "BatchTransferred")
        .withArgs(BATCH_ID, farmerAddress, distributorAddress, transferPrice, location);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.currentOwner).to.equal(distributorAddress);
      expect(batch.currentPrice).to.equal(transferPrice);

      const transfers = await supplyChain.getTransferHistory(BATCH_ID);
      expect(transfers.length).to.equal(1);
      expect(transfers[0].from).to.equal(farmerAddress);
      expect(transfers[0].to).to.equal(distributorAddress);
      expect(transfers[0].price).to.equal(transferPrice);
    });

    it("Should fail transfer with invalid parameters", async function () {
      const transferPrice = ethers.parseEther("0.012");
      const location = "Warehouse A";
      const remarks = "Transfer to distributor";

      // Invalid recipient address
      await expect(
        supplyChain.connect(farmer).transferBatch(
          BATCH_ID,
          ethers.ZeroAddress,
          transferPrice,
          location,
          remarks
        )
      ).to.be.revertedWith("Invalid recipient address");

      // Transfer to self
      await expect(
        supplyChain.connect(farmer).transferBatch(
          BATCH_ID,
          farmerAddress,
          transferPrice,
          location,
          remarks
        )
      ).to.be.revertedWith("Cannot transfer to yourself");

      // Zero price
      await expect(
        supplyChain.connect(farmer).transferBatch(
          BATCH_ID,
          distributorAddress,
          0,
          location,
          remarks
        )
      ).to.be.revertedWith("Transfer price must be greater than 0");
    });

    it("Should fail if not called by batch owner", async function () {
      const transferPrice = ethers.parseEther("0.012");

      await expect(
        supplyChain.connect(distributor).transferBatch(
          BATCH_ID,
          retailerAddress,
          transferPrice,
          "Location",
          "Remarks"
        )
      ).to.be.revertedWith("Only batch owner can perform this action");
    });
  });

  describe("Batch Status Updates", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should update batch status successfully", async function () {
      // Update to harvested (only farmers can do this)
      await expect(
        supplyChain.connect(farmer).updateBatchStatus(BATCH_ID, 1) // Harvested
      ).to.emit(supplyChain, "BatchStatusUpdated")
        .withArgs(BATCH_ID, 0, 1, farmerAddress); // From Registered to Harvested

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(1); // Harvested
    });

    it("Should enforce role-based status updates", async function () {
      // Only farmers can mark as harvested
      await expect(
        supplyChain.connect(distributor).updateBatchStatus(BATCH_ID, 1) // Harvested
      ).to.be.revertedWith("Only farmers can mark as harvested");

      // Transfer batch to distributor first
      await supplyChain.connect(farmer).transferBatch(
        BATCH_ID,
        distributorAddress,
        ethers.parseEther("0.012"),
        "Location",
        "Remarks"
      );

      // Now distributor can update to InTransit
      await expect(
        supplyChain.connect(distributor).updateBatchStatus(BATCH_ID, 3) // InTransit
      ).to.emit(supplyChain, "BatchStatusUpdated");
    });
  });

  describe("Quality Checks", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should add quality check successfully", async function () {
      const qualityScore = 85;
      const remarks = "Excellent quality";
      const reportHash = "QmQualityReportHash";

      await expect(
        supplyChain.connect(regulator).addQualityCheck(
          BATCH_ID,
          qualityScore,
          remarks,
          reportHash
        )
      ).to.emit(supplyChain, "QualityCheckAdded")
        .withArgs(BATCH_ID, regulatorAddress, qualityScore, true); // true because score >= 70

      const qualityChecks = await supplyChain.getQualityChecks(BATCH_ID);
      expect(qualityChecks.length).to.equal(1);
      expect(qualityChecks[0].inspector).to.equal(regulatorAddress);
      expect(qualityChecks[0].qualityScore).to.equal(qualityScore);
      expect(qualityChecks[0].passed).to.be.true;
    });

    it("Should fail quality check with low score", async function () {
      const qualityScore = 60; // Below 70 threshold
      const remarks = "Poor quality";
      const reportHash = "QmQualityReportHash";

      await expect(
        supplyChain.connect(regulator).addQualityCheck(
          BATCH_ID,
          qualityScore,
          remarks,
          reportHash
        )
      ).to.emit(supplyChain, "QualityCheckAdded")
        .withArgs(BATCH_ID, regulatorAddress, qualityScore, false); // false because score < 70

      const qualityChecks = await supplyChain.getQualityChecks(BATCH_ID);
      expect(qualityChecks[0].passed).to.be.false;
    });

    it("Should fail if not called by regulator", async function () {
      await expect(
        supplyChain.connect(farmer).addQualityCheck(
          BATCH_ID,
          85,
          "Remarks",
          "Hash"
        )
      ).to.be.reverted;
    });

    it("Should validate quality score range", async function () {
      await expect(
        supplyChain.connect(regulator).addQualityCheck(
          BATCH_ID,
          101, // Invalid score > 100
          "Remarks",
          "Hash"
        )
      ).to.be.revertedWith("Quality score must be between 0-100");
    });
  });

  describe("Price Updates", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should update price successfully", async function () {
      const newPrice = ethers.parseEther("0.015");

      await expect(
        supplyChain.connect(farmer).updatePrice(BATCH_ID, newPrice)
      ).to.emit(supplyChain, "PriceUpdated")
        .withArgs(BATCH_ID, BASE_PRICE, newPrice, farmerAddress);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.currentPrice).to.equal(newPrice);
    });

    it("Should fail with zero price", async function () {
      await expect(
        supplyChain.connect(farmer).updatePrice(BATCH_ID, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should fail if not called by owner", async function () {
      await expect(
        supplyChain.connect(distributor).updatePrice(BATCH_ID, ethers.parseEther("0.02"))
      ).to.be.revertedWith("Only batch owner can perform this action");
    });
  });

  describe("Mark as Sold", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should mark batch as sold successfully", async function () {
      const finalPrice = ethers.parseEther("0.02");

      await expect(
        supplyChain.connect(farmer).markAsSold(BATCH_ID, consumerAddress, finalPrice)
      ).to.emit(supplyChain, "BatchSold")
        .withArgs(BATCH_ID, farmerAddress, consumerAddress, finalPrice);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(5); // Sold
      expect(batch.currentPrice).to.equal(finalPrice);
    });

    it("Should fail with invalid parameters", async function () {
      // Invalid buyer address
      await expect(
        supplyChain.connect(farmer).markAsSold(BATCH_ID, ethers.ZeroAddress, ethers.parseEther("0.02"))
      ).to.be.revertedWith("Invalid buyer address");

      // Zero price
      await expect(
        supplyChain.connect(farmer).markAsSold(BATCH_ID, consumerAddress, 0)
      ).to.be.revertedWith("Final price must be greater than 0");
    });

    it("Should fail if already sold", async function () {
      // Mark as sold first time
      await supplyChain.connect(farmer).markAsSold(BATCH_ID, consumerAddress, ethers.parseEther("0.02"));

      // Try to mark as sold again
      await expect(
        supplyChain.connect(farmer).markAsSold(BATCH_ID, consumerAddress, ethers.parseEther("0.02"))
      ).to.be.revertedWith("Batch already sold");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        BATCH_ID,
        PRODUCE_TYPE,
        VARIETY,
        QUANTITY,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        true
      );
    });

    it("Should return correct batch exists status", async function () {
      expect(await supplyChain.batchExists(BATCH_ID)).to.be.true;
      expect(await supplyChain.batchExists("NON_EXISTENT")).to.be.false;
    });

    it("Should return user batches correctly", async function () {
      const userBatches = await supplyChain.getUserBatches(farmerAddress);
      expect(userBatches.length).to.equal(1);
      expect(userBatches[0]).to.equal(BATCH_ID);

      // Other users should have no batches
      const distributorBatches = await supplyChain.getUserBatches(distributorAddress);
      expect(distributorBatches.length).to.equal(0);
    });

    it("Should return correct total batches", async function () {
      expect(await supplyChain.getTotalBatches()).to.equal(1);

      // Register another batch
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await supplyChain.connect(farmer).registerBatch(
        "BATCH_002",
        "Carrots",
        "Orange Carrots",
        500,
        ORIGIN,
        BASE_PRICE,
        expiryDate,
        CERTIFICATION_HASH,
        IMAGE_HASH,
        false
      );

      expect(await supplyChain.getTotalBatches()).to.equal(2);
    });

    it("Should return all batch IDs", async function () {
      const allBatchIds = await supplyChain.getAllBatchIds();
      expect(allBatchIds.length).to.equal(1);
      expect(allBatchIds[0]).to.equal(BATCH_ID);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause contract", async function () {
      // Pause contract
      await supplyChain.pause();
      expect(await supplyChain.paused()).to.be.true;

      // Should fail to register batch when paused
      const expiryDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.be.revertedWith("Pausable: paused");

      // Unpause contract
      await supplyChain.unpause();
      expect(await supplyChain.paused()).to.be.false;

      // Should work after unpause
      await expect(
        supplyChain.connect(farmer).registerBatch(
          BATCH_ID,
          PRODUCE_TYPE,
          VARIETY,
          QUANTITY,
          ORIGIN,
          BASE_PRICE,
          expiryDate,
          CERTIFICATION_HASH,
          IMAGE_HASH,
          true
        )
      ).to.emit(supplyChain, "BatchRegistered");
    });

    it("Should only allow admin to pause/unpause", async function () {
      await expect(
        supplyChain.connect(farmer).pause()
      ).to.be.reverted;

      await expect(
        supplyChain.connect(farmer).unpause()
      ).to.be.reverted;
    });
  });
});