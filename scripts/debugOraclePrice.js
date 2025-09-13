const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging oracle price in LendingPool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const LEASING_POOL_ADDRESS = "0xC27B1396d2e478bC113abe1794A6eC701B0b28D2";
  const BTC_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";

  const lendingPool = await ethers.getContractAt("LendingPool", LEASING_POOL_ADDRESS);
  const btcOracle = await ethers.getContractAt("BTCOracle", BTC_ORACLE_ADDRESS);

  try {
    // Check oracle price directly
    console.log("📊 Direct Oracle Check:");
    const directPrice = await btcOracle.getLatestPrice();
    console.log("Direct BTC price:", ethers.utils.formatUnits(directPrice, 6), "USD");

    // Check what oracle the lending pool is using
    console.log("\n📋 LendingPool Oracle:");
    const poolOracleAddress = await lendingPool.priceOracle();
    console.log("Pool oracle address:", poolOracleAddress);
    console.log("Expected oracle address:", BTC_ORACLE_ADDRESS);
    console.log("Addresses match:", poolOracleAddress.toLowerCase() === BTC_ORACLE_ADDRESS.toLowerCase());

    // Test collateral value calculation
    console.log("\n🧮 Testing collateral value calculation:");
    const testCollateral = ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC
    
    console.log("Test collateral:", ethers.utils.formatUnits(testCollateral, 8), "bBTC");
    
    // This should work if oracle is integrated correctly
    try {
      // Call the contract's collateral value calculation directly
      const collateralValueCall = await lendingPool.callStatic._getCollateralValue ? 
        lendingPool.callStatic._getCollateralValue(testCollateral) : 
        "Function not available";
        
      if (typeof collateralValueCall !== 'string') {
        console.log("Collateral value (USD):", ethers.utils.formatUnits(collateralValueCall, 6), "USD");
        const maxBorrow = collateralValueCall.mul(5000).div(10000); // 50% LTV
        console.log("Max borrow (50% LTV):", ethers.utils.formatUnits(maxBorrow, 6), "USDC");
      } else {
        console.log("Cannot call _getCollateralValue directly (private function)");
      }
    } catch (error) {
      console.log("Collateral calculation error:", error.message);
    }

    // Check LTV constants
    console.log("\n📏 LTV Configuration:");
    const ltvRatio = await lendingPool.LTV_RATIO();
    console.log("LTV Ratio:", ltvRatio.toString(), "basis points");
    console.log("LTV Percentage:", (ltvRatio / 100).toString(), "%");

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });