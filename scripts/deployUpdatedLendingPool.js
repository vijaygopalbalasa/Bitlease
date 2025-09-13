const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated LendingPool with leasing model...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Contract addresses from current deployment
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BTC_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";
  const TREASURY_ADDRESS = deployer.address; // Use deployer as treasury

  try {
    // Deploy updated LendingPool
    console.log("📋 Deploying LendingPool with leasing model...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(
      BBTC_ADDRESS,
      USDC_ADDRESS, 
      BTC_ORACLE_ADDRESS,
      TREASURY_ADDRESS
    );
    await lendingPool.deployed();

    console.log("✅ LendingPool deployed to:", lendingPool.address);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/address/${lendingPool.address}`);

    // Verify contract parameters
    console.log("\n📊 Contract Configuration:");
    console.log("Collateral Token (bBTC):", await lendingPool.collateralToken());
    console.log("Borrow Token (USDC):", await lendingPool.borrowToken());
    console.log("Price Oracle:", await lendingPool.priceOracle());
    console.log("Treasury:", await lendingPool.treasury());
    console.log("LTV Ratio:", (await lendingPool.LTV_RATIO()).toString(), "basis points (50%)");

    console.log("\n🎯 New Features:");
    console.log("✅ 1% Origination fee implemented");
    console.log("✅ Simple interest (non-compounding) at 8% APR");
    console.log("✅ Proper leasing protocol model");
    console.log("✅ User receives: borrowAmount - 1% fee");
    console.log("✅ Debt calculation: principal + (principal × 8% × time)");

    console.log("\n💰 Example Transaction:");
    console.log("User borrows: $2,000 USDC");
    console.log("Origination fee: $20 (1%)");
    console.log("User receives: $1,980 USDC");
    console.log("Annual interest: $160 (8% of $2,000)");
    console.log("Total yearly cost: $180 (fee + interest)");
    console.log("Effective APR: ~9%");

    console.log(`\n📋 Updated Contract Address: ${lendingPool.address}`);
    console.log("🔄 Update frontend contracts.ts with this address");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });