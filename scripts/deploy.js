const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BitLease to CoreDAO Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "tCORE\n");

  // Deploy Mock Tokens
  console.log("1. Deploying Mock Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await mockUSDC.deployed();
  console.log("✅ Mock USDC:", mockUSDC.address);

  const mockWBTC = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
  await mockWBTC.deployed();
  console.log("✅ Mock WBTC:", mockWBTC.address);

  // Deploy bBTC
  console.log("\n2. Deploying bBTC...");
  const bBTC = await ethers.getContractFactory("bBTC");
  const bbtc = await bBTC.deploy(mockWBTC.address);
  await bbtc.deployed();
  console.log("✅ bBTC:", bbtc.address);

  // Deploy GPUOracle
  console.log("\n3. Deploying GPUOracle...");
  const GPUOracle = await ethers.getContractFactory("GPUOracle");
  const oracle = await GPUOracle.deploy();
  await oracle.deployed();
  console.log("✅ GPUOracle:", oracle.address);

  // Use existing professional BTC Consumer Oracle
  console.log("\n4. Using professional BTC Consumer Oracle...");
  const btcConsumerAddress = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e"; // Deployed Consumer
  console.log("✅ BTC Consumer Oracle:", btcConsumerAddress);

  // Deploy LendingPool  
  console.log("\n5. Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    bbtc.address,
    mockUSDC.address,
    btcConsumerAddress, // Use professional BTC Consumer oracle
    deployer.address  // Treasury
  );
  await lendingPool.deployed();
  console.log("✅ LendingPool:", lendingPool.address);

  // Deploy LeaseManager
  console.log("\n6. Deploying LeaseManager...");
  const LeaseManager = await ethers.getContractFactory("LeaseManager");
  const leaseManager = await LeaseManager.deploy(lendingPool.address, oracle.address);
  await leaseManager.deployed();
  console.log("✅ LeaseManager:", leaseManager.address);

  // Initialize with demo data
  console.log("\n7. Setting up demo data...");
  
  // Mint demo tokens for easy testing
  await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("100000", 6));
  await mockWBTC.mint(deployer.address, ethers.utils.parseUnits("10", 8));
  console.log("✅ Minted demo tokens for deployer");
  
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(50));
  console.log("📋 CONTRACT ADDRESSES:");
  console.log("MOCK_USDC_ADDRESS=" + mockUSDC.address);
  console.log("MOCK_WBTC_ADDRESS=" + mockWBTC.address);
  console.log("BBTC_ADDRESS=" + bbtc.address);
  console.log("LENDING_POOL_ADDRESS=" + lendingPool.address);
  console.log("GPU_ORACLE_ADDRESS=" + oracle.address);
  console.log("LEASE_MANAGER_ADDRESS=" + leaseManager.address);
  console.log("=" .repeat(50));
  console.log("🔗 Explorer: https://scan.test2.coredao.org");
  console.log("💰 Faucet: https://scan.test2.coredao.org/faucet");

  // Save addresses for frontend
  const addresses = {
    mockUSDC: mockUSDC.address,
    mockWBTC: mockWBTC.address,
    bBTC: bbtc.address,
    lendingPool: lendingPool.address,
    btcOracle: btcConsumerAddress,
    gpuOracle: oracle.address,
    leaseManager: leaseManager.address,
    deployer: deployer.address
  };

  const fs = require("fs");
  const path = require("path");
  
  // Save addresses
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Contract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });