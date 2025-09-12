const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying new LendingPool with fresh oracle...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  try {
    // Contract addresses
    const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
    const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
    const FRESH_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C"; // Our fresh oracle
    const TREASURY_ADDRESS = deployer.address; // Use deployer as treasury for now

    console.log("📋 Deployment Configuration:");
    console.log("USDC Token:", USDC_ADDRESS);
    console.log("bBTC Token:", BBTC_ADDRESS);
    console.log("BTC Oracle:", FRESH_ORACLE_ADDRESS);
    console.log("Treasury:", TREASURY_ADDRESS);

    // Verify the oracle has fresh price
    console.log("\n🔍 Verifying oracle price...");
    const BTCOracle = await ethers.getContractFactory("BTCOracle");
    const oracle = BTCOracle.attach(FRESH_ORACLE_ADDRESS);
    
    const [currentPrice, timestamp] = await oracle.getPriceWithTimestamp();
    const priceUSD = ethers.utils.formatUnits(currentPrice, 6);
    const lastUpdate = new Date(timestamp * 1000);
    
    console.log("Current BTC Price:", priceUSD, "USDC");
    console.log("Last Updated:", lastUpdate.toLocaleString());
    console.log("Age:", Math.floor((Date.now() - lastUpdate.getTime()) / 1000), "seconds");

    // Deploy new lending pool
    console.log("\n🚀 Deploying LendingPool...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    
    const lendingPool = await LendingPool.deploy(
      BBTC_ADDRESS,
      USDC_ADDRESS,
      FRESH_ORACLE_ADDRESS,
      TREASURY_ADDRESS
    );
    
    await lendingPool.deployed();
    
    console.log("✅ New LendingPool deployed at:", lendingPool.address);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/address/${lendingPool.address}`);

    // Add initial liquidity to the pool
    console.log("\n💧 Adding initial USDC liquidity...");
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    
    // Check deployer balance
    const deployerBalance = await usdc.balanceOf(deployer.address);
    console.log("Deployer USDC balance:", ethers.utils.formatUnits(deployerBalance, 6), "USDC");
    
    if (deployerBalance.gt(ethers.utils.parseUnits("50000", 6))) {
      const liquidityAmount = ethers.utils.parseUnits("50000", 6); // 50k USDC
      
      const transferTx = await usdc.transfer(lendingPool.address, liquidityAmount);
      await transferTx.wait();
      
      console.log("✅ Added 50,000 USDC liquidity");
      console.log("🔗 Transfer Tx:", `https://scan.test2.btcs.network/tx/${transferTx.hash}`);
    } else {
      console.log("⚠️ Not enough USDC balance for initial liquidity");
      console.log("Manual liquidity addition required");
    }

    // Test the lending pool configuration
    console.log("\n🧪 Testing lending pool configuration...");
    try {
      const poolUsdcToken = await lendingPool.lendingToken();
      const poolBbtcToken = await lendingPool.collateralToken();
      const poolOracle = await lendingPool.priceOracle();
      
      console.log("Pool USDC token:", poolUsdcToken);
      console.log("Pool bBTC token:", poolBbtcToken);
      console.log("Pool Oracle:", poolOracle);
      
      if (poolOracle.toLowerCase() === FRESH_ORACLE_ADDRESS.toLowerCase()) {
        console.log("✅ Oracle correctly configured");
      } else {
        console.log("❌ Oracle configuration mismatch");
      }
    } catch (error) {
      console.log("Could not verify pool configuration:", error.message);
    }

    console.log("\n🎉 New lending pool deployment complete!");
    console.log(`📋 New LendingPool: ${lendingPool.address}`);
    console.log(`📋 Fresh Oracle: ${FRESH_ORACLE_ADDRESS}`);
    console.log(`📋 Current BTC Price: $${priceUSD}`);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend contracts.ts with new LendingPool address");
    console.log("2. Test complete borrowing flow");
    console.log("3. Verify all functionality works end-to-end");

    // Generate the contract update
    console.log(`\n📝 Update frontend/lib/contracts.ts:`);
    console.log(`LendingPool: '${lendingPool.address}',`);

  } catch (error) {
    console.error("❌ Failed to deploy new lending pool:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });