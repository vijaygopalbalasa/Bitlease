const hre = require("hardhat");

async function main() {
  console.log("🧪 TESTING HOTFIX CONTRACT");
  
  const hotfixContractAddr = "0x3Cf9Da00a206c8F0970488C70Aa6806a74bd573B";
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(hotfixContractAddr);
  
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  console.log("\n1. CONTRACT STATE:");
  const contractBalance = await usdc.balanceOf(hotfixContractAddr);
  console.log("- USDC Balance:", hre.ethers.utils.formatUnits(contractBalance, 6), "USDC");
  
  try {
    const poolData = await lendingPool.poolData();
    console.log("- totalSupplied:", hre.ethers.utils.formatUnits(poolData.totalSupplied, 6), "USDC");
    console.log("- totalBorrowed:", hre.ethers.utils.formatUnits(poolData.totalBorrowed, 6), "USDC");
  } catch (e) {
    console.log("- Could not read poolData");
  }
  
  console.log("\n2. LIQUIDITY CHECK TEST:");
  
  // Test the exact parameters that were failing
  const collateralAmount = "100000"; // 0.001 bBTC (smaller for testing)
  const borrowAmount = "57987500"; // $57.99 USDC
  
  console.log("Testing borrow:");
  console.log("- Collateral:", (parseInt(collateralAmount) / 1e8).toFixed(8), "bBTC");
  console.log("- Borrow:", (parseInt(borrowAmount) / 1e6).toFixed(2), "USDC");
  
  // Static call test
  try {
    const result = await hre.ethers.provider.call({
      to: hotfixContractAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
      from: userAddr
    });
    console.log("✅ Static call SUCCESS");
  } catch (error) {
    console.log("❌ Static call FAILED:", error.reason || error.message);
  }
  
  // Gas estimation test
  try {
    const gasEstimate = await hre.ethers.provider.estimateGas({
      to: hotfixContractAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
      from: userAddr
    });
    console.log("✅ Gas estimation SUCCESS:", gasEstimate.toString());
  } catch (error) {
    console.log("❌ Gas estimation FAILED:", error.reason || error.message);
  }
  
  console.log("\n3. LARGER AMOUNT TEST:");
  const largeBorrowAmount = "10000000000"; // $10,000 USDC
  console.log("Testing larger borrow: $10,000 USDC");
  
  try {
    await hre.ethers.provider.call({
      to: hotfixContractAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, largeBorrowAmount]),
      from: userAddr
    });
    console.log("✅ Large borrow call SUCCESS");
  } catch (error) {
    console.log("❌ Large borrow call FAILED:", error.reason || error.message);
  }
  
  console.log("\n🎉 HOTFIX TEST COMPLETE!");
  console.log("If all tests pass, the liquidity bug is fixed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });