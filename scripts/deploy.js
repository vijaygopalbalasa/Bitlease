const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Mock Tokens first
  console.log("\n🚀 Deploying Mock Tokens...");
  
  const MockBTC = await ethers.getContractFactory("MockBTC");
  const mockBTC = await MockBTC.deploy();
  await mockBTC.deployed();
  console.log("MockBTC deployed to:", mockBTC.address);
  
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);

  // Deploy Mock Core Staking
  console.log("\n🚀 Deploying Mock Core Staking...");
  const MockCoreStaking = await ethers.getContractFactory("MockCoreStaking");
  const mockCoreStaking = await MockCoreStaking.deploy(mockBTC.address);
  await mockCoreStaking.deployed();
  console.log("MockCoreStaking deployed to:", mockCoreStaking.address);

  // Deploy bBTC Vault
  console.log("\n🚀 Deploying bBTC Vault...");
  const bBTC = await ethers.getContractFactory("bBTC");
  const bBTCVault = await bBTC.deploy(
    mockBTC.address,
    mockCoreStaking.address,
    deployer.address // Fee collector
  );
  await bBTCVault.deployed();
  console.log("bBTC Vault deployed to:", bBTCVault.address);

  // Deploy GPU Oracle
  console.log("\n🚀 Deploying GPU Oracle...");
  const GPUOracle = await ethers.getContractFactory("GPUOracle");
  const gpuOracle = await GPUOracle.deploy();
  await gpuOracle.deployed();
  console.log("GPUOracle deployed to:", gpuOracle.address);

  // Deploy Lending Pool
  console.log("\n🚀 Deploying Lending Pool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    bBTCVault.address,     // bBTC as collateral
    mockUSDC.address,      // USDC as borrow token
    deployer.address,      // Mock price oracle (using deployer for now)
    deployer.address       // Treasury
  );
  await lendingPool.deployed();
  console.log("LendingPool deployed to:", lendingPool.address);

  // Deploy Lease Manager
  console.log("\n🚀 Deploying Lease Manager...");
  const LeaseManager = await ethers.getContractFactory("LeaseManager");
  const leaseManager = await LeaseManager.deploy(
    bBTCVault.address,     // bBTC as collateral
    mockUSDC.address,      // USDC as payment
    lendingPool.address,   // Lending pool
    gpuOracle.address,     // GPU oracle
    deployer.address       // Fee collector
  );
  await leaseManager.deployed();
  console.log("LeaseManager deployed to:", leaseManager.address);

  // Setup initial liquidity and permissions
  console.log("\n⚙️ Setting up initial state...");
  
  // Mint initial tokens to deployer
  await mockBTC.mint(deployer.address, ethers.utils.parseUnits("100", 8)); // 100 BTC
  await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("1000000", 6)); // 1M USDC
  
  // Supply initial liquidity to lending pool
  await mockUSDC.approve(lendingPool.address, ethers.utils.parseUnits("500000", 6));
  await lendingPool.supply(ethers.utils.parseUnits("500000", 6)); // 500k USDC
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("=".repeat(50));
  console.log("MockBTC:", mockBTC.address);
  console.log("MockUSDC:", mockUSDC.address);
  console.log("MockCoreStaking:", mockCoreStaking.address);
  console.log("bBTC Vault:", bBTCVault.address);
  console.log("GPUOracle:", gpuOracle.address);
  console.log("LendingPool:", lendingPool.address);
  console.log("LeaseManager:", leaseManager.address);
  console.log("=".repeat(50));

  // Save addresses to a file for frontend use
  const addresses = {
    MockBTC: mockBTC.address,
    MockUSDC: mockUSDC.address,
    MockCoreStaking: mockCoreStaking.address,
    bBTC: bBTCVault.address,
    GPUOracle: gpuOracle.address,
    LendingPool: lendingPool.address,
    LeaseManager: leaseManager.address,
    deployer: deployer.address
  };

  const fs = require("fs");
  fs.writeFileSync(
    "./frontend/src/contracts/addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Contract addresses saved to frontend/src/contracts/addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });