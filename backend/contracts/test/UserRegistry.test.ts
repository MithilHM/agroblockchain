import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("UserRegistry", function () {
  let userRegistry: Contract;
  let deployer: Signer;
  let farmer: Signer;
  let distributor: Signer;
  let retailer: Signer;

  let deployerAddress: string;
  let farmerAddress: string;
  let distributorAddress: string;
  let retailerAddress: string;

  beforeEach(async function () {
    [deployer, farmer, distributor, retailer] = await ethers.getSigners();
    
    deployerAddress = await deployer.getAddress();
    farmerAddress = await farmer.getAddress();
    distributorAddress = await distributor.getAddress();
    retailerAddress = await retailer.getAddress();

    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const DEFAULT_ADMIN_ROLE = await userRegistry.DEFAULT_ADMIN_ROLE();
      expect(await userRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress)).to.be.true;
    });

    it("Should have zero users initially", async function () {
      expect(await userRegistry.getTotalUsers()).to.equal(0);
    });
  });

  describe("User Registration", function () {
    it("Should register a farmer successfully", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      
      await expect(
        userRegistry.connect(farmer).registerUser(
          "John Doe",
          "john@farm.com",
          "+1234567890",
          "Farm Valley",
          FARMER_ROLE,
          "QmProfileHash123"
        )
      ).to.emit(userRegistry, "UserRegistered")
        .withArgs(farmerAddress, "John Doe", FARMER_ROLE, await ethers.provider.getBlockNumber() + 1);

      const user = await userRegistry.getUser(farmerAddress);
      expect(user.name).to.equal("John Doe");
      expect(user.email).to.equal("john@farm.com");
      expect(user.role).to.equal(FARMER_ROLE);
      expect(user.isActive).to.be.true;
    });

    it("Should fail with empty name", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      
      await expect(
        userRegistry.connect(farmer).registerUser(
          "",
          "john@farm.com",
          "+1234567890",
          "Farm Valley",
          FARMER_ROLE,
          "QmProfileHash123"
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail with empty email", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      
      await expect(
        userRegistry.connect(farmer).registerUser(
          "John Doe",
          "",
          "+1234567890",
          "Farm Valley",
          FARMER_ROLE,
          "QmProfileHash123"
        )
      ).to.be.revertedWith("Email cannot be empty");
    });

    it("Should fail with invalid role", async function () {
      const INVALID_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));
      
      await expect(
        userRegistry.connect(farmer).registerUser(
          "John Doe",
          "john@farm.com",
          "+1234567890",
          "Farm Valley",
          INVALID_ROLE,
          "QmProfileHash123"
        )
      ).to.be.revertedWith("Invalid role");
    });

    it("Should fail if user already registered", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      
      // Register first time
      await userRegistry.connect(farmer).registerUser(
        "John Doe",
        "john@farm.com",
        "+1234567890",
        "Farm Valley",
        FARMER_ROLE,
        "QmProfileHash123"
      );

      // Try to register again
      await expect(
        userRegistry.connect(farmer).registerUser(
          "John Doe",
          "john@farm.com",
          "+1234567890", 
          "Farm Valley",
          FARMER_ROLE,
          "QmProfileHash123"
        )
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Role Management", function () {
    beforeEach(async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      await userRegistry.connect(farmer).registerUser(
        "John Doe",
        "john@farm.com",
        "+1234567890",
        "Farm Valley",
        FARMER_ROLE,
        "QmProfileHash123"
      );
    });

    it("Should update user role by admin", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      const DISTRIBUTOR_ROLE = await userRegistry.DISTRIBUTOR_ROLE();

      await expect(
        userRegistry.connect(deployer).updateUserRole(farmerAddress, DISTRIBUTOR_ROLE)
      ).to.emit(userRegistry, "UserRoleUpdated")
        .withArgs(farmerAddress, FARMER_ROLE, DISTRIBUTOR_ROLE, deployerAddress);

      const user = await userRegistry.getUser(farmerAddress);
      expect(user.role).to.equal(DISTRIBUTOR_ROLE);
    });

    it("Should fail role update by non-admin", async function () {
      const DISTRIBUTOR_ROLE = await userRegistry.DISTRIBUTOR_ROLE();

      await expect(
        userRegistry.connect(farmer).updateUserRole(farmerAddress, DISTRIBUTOR_ROLE)
      ).to.be.reverted;
    });
  });

  describe("User Activation/Deactivation", function () {
    beforeEach(async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      await userRegistry.connect(farmer).registerUser(
        "John Doe",
        "john@farm.com",
        "+1234567890",
        "Farm Valley",
        FARMER_ROLE,
        "QmProfileHash123"
      );
    });

    it("Should deactivate user by admin", async function () {
      await expect(
        userRegistry.connect(deployer).deactivateUser(farmerAddress)
      ).to.emit(userRegistry, "UserDeactivated")
        .withArgs(farmerAddress, deployerAddress);

      const user = await userRegistry.getUser(farmerAddress);
      expect(user.isActive).to.be.false;
      expect(await userRegistry.isActiveUser(farmerAddress)).to.be.false;
    });

    it("Should reactivate user by admin", async function () {
      // Deactivate first
      await userRegistry.connect(deployer).deactivateUser(farmerAddress);

      // Then reactivate
      await expect(
        userRegistry.connect(deployer).reactivateUser(farmerAddress)
      ).to.emit(userRegistry, "UserReactivated")
        .withArgs(farmerAddress, deployerAddress);

      const user = await userRegistry.getUser(farmerAddress);
      expect(user.isActive).to.be.true;
      expect(await userRegistry.isActiveUser(farmerAddress)).to.be.true;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      const DISTRIBUTOR_ROLE = await userRegistry.DISTRIBUTOR_ROLE();

      await userRegistry.connect(farmer).registerUser(
        "John Doe",
        "john@farm.com",
        "+1234567890",
        "Farm Valley",
        FARMER_ROLE,
        "QmProfileHash123"
      );

      await userRegistry.connect(distributor).registerUser(
        "Distribution Co",
        "dist@company.com",
        "+1234567891",
        "City Center",
        DISTRIBUTOR_ROLE,
        "QmProfileHash456"
      );
    });

    it("Should return users by role", async function () {
      const FARMER_ROLE = await userRegistry.FARMER_ROLE();
      const DISTRIBUTOR_ROLE = await userRegistry.DISTRIBUTOR_ROLE();

      const farmers = await userRegistry.getUsersByRole(FARMER_ROLE);
      expect(farmers.length).to.equal(1);
      expect(farmers[0]).to.equal(farmerAddress);

      const distributors = await userRegistry.getUsersByRole(DISTRIBUTOR_ROLE);
      expect(distributors.length).to.equal(1);
      expect(distributors[0]).to.equal(distributorAddress);
    });

    it("Should return all users", async function () {
      const allUsers = await userRegistry.getAllUsers();
      expect(allUsers.length).to.equal(2);
      expect(allUsers).to.include(farmerAddress);
      expect(allUsers).to.include(distributorAddress);
    });

    it("Should return correct total users", async function () {
      expect(await userRegistry.getTotalUsers()).to.equal(2);
    });

    it("Should check active user status", async function () {
      expect(await userRegistry.isActiveUser(farmerAddress)).to.be.true;
      expect(await userRegistry.isActiveUser(retailerAddress)).to.be.false; // Not registered
    });
  });
});