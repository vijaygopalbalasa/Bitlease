const hre = require("hardhat");

async function main() {
  console.log("=== DEBUGGING LTV CALCULATION ISSUE ===");
  
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  
  console.log("User:", userAddr);
  console.log("New Contract:", lendingPoolAddr);
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  // Test values from user
  const collateralAmount = hre.ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC
  const borrowAmount = hre.ethers.utils.parseUnits("580.03", 6);   // $580.03 USDC
  const btcPriceFrontend = hre.ethers.BigNumber.from("116006283000"); // $116,006.283 in 6 decimals
  
  console.log("\nTest Parameters:");
  console.log("- Collateral:", collateralAmount.toString(), "(0.01 bBTC)");
  console.log("- Borrow Amount:", borrowAmount.toString(), "($580.03 USDC)");  
  console.log("- Frontend BTC Price:", btcPriceFrontend.toString(), "($116,006.283)");
  
  // Check contract constants
  const LTV_RATIO = await lendingPool.LTV_RATIO();
  const PRECISION = await lendingPool.PRECISION();
  console.log("\nContract Constants:");
  console.log("- LTV_RATIO:", LTV_RATIO.toString(), "(" + (LTV_RATIO.toNumber() / 100) + "%)");
  console.log("- PRECISION:", PRECISION.toString());
  
  // Get oracle price directly from contract
  console.log("\nOracle Check:");
  try {
    const oracleAddr = await lendingPool.priceOracle();
    console.log("- Oracle Address:", oracleAddr);
    
    // Call oracle directly
    const result = await hre.ethers.provider.call({
      to: oracleAddr,
      data: "0x8e15f473" // getLatestPrice() function selector
    });
    
    if (result && result !== "0x") {
      const oraclePrice = hre.ethers.BigNumber.from(result);
      console.log("- Oracle BTC Price:", oraclePrice.toString());
      console.log("- Oracle Price ($):", hre.ethers.utils.formatUnits(oraclePrice, 6));
      console.log("- Frontend vs Oracle match?", oraclePrice.eq(btcPriceFrontend));
      
      // Use oracle price for calculations
      const contractPrice = oraclePrice;
      
      console.log("\nContract LTV Calculation (using oracle price):");
      // Contract logic: collateralValue = (collateralAmount * btcPrice) / 1e8
      const collateralValue = collateralAmount.mul(contractPrice).div(hre.ethers.utils.parseUnits("1", 8));
      const maxBorrow = collateralValue.mul(LTV_RATIO).div(PRECISION);
      
      console.log("- Collateral Value:", collateralValue.toString(), "($" + hre.ethers.utils.formatUnits(collateralValue, 6) + ")");
      console.log("- Max Borrow (50%):", maxBorrow.toString(), "($" + hre.ethers.utils.formatUnits(maxBorrow, 6) + ")");
      console.log("- Requested Borrow:", borrowAmount.toString(), "($" + hre.ethers.utils.formatUnits(borrowAmount, 6) + ")");
      console.log("- LTV Check Passes?", borrowAmount.lte(maxBorrow));
      console.log("- Difference:", maxBorrow.sub(borrowAmount).toString(), "($" + hre.ethers.utils.formatUnits(maxBorrow.sub(borrowAmount), 6) + ")");
      
    } else {
      console.log("- Oracle call returned no data");
    }
  } catch (err) {
    console.log("- Oracle call failed:", err.message);
  }
  
  // Try to simulate the borrow call
  console.log("\nSimulating Borrow Call:");
  try {
    const result = await hre.ethers.provider.call({
      to: lendingPoolAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
      from: userAddr
    });
    console.log("✅ Borrow simulation succeeded");
  } catch (error) {
    console.log("❌ Borrow simulation failed:");
    console.log("Error:", error.reason || error.message);
    
    // Check if it's the LTV error specifically
    if (error.message.includes("LTV") || error.message.includes("collateral")) {
      console.log("\n🔍 This confirms the LTV validation is failing in the contract");
    }
  }
  
  // Compare with old contract behavior (for reference)
  console.log("\n=== COMPARISON WITH FRONTEND CALCULATION ===");
  const frontendCollateralValue = collateralAmount.mul(btcPriceFrontend).div(hre.ethers.utils.parseUnits("1", 8));
  const frontendMaxBorrow = frontendCollateralValue.div(2); // 50% LTV
  
  console.log("Frontend Calculation:");
  console.log("- Collateral Value:", frontendCollateralValue.toString(), "($" + hre.ethers.utils.formatUnits(frontendCollateralValue, 6) + ")");
  console.log("- Max Borrow (50%):", frontendMaxBorrow.toString(), "($" + hre.ethers.utils.formatUnits(frontendMaxBorrow, 6) + ")");
  
  console.log("\n=== DIAGNOSIS ===");
  console.log("If the oracle price differs from frontend price, that's the issue.");
  console.log("If the contract LTV calculation differs from expected, that's a contract bug.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });