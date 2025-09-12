const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract state and BTC price...\n");

  // Contract addresses
  const addresses = {
    btcOracle: "0x321440a843027E339A9aEA0d307583fA47bdBf80",
    lendingPool: "0xF5416626C8ABb9508CC71294cf3e6f3A161E166E"
  };

  // Get contract instances
  const BTCOracle = await ethers.getContractFactory("BTCOracle");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  
  const btcOracle = BTCOracle.attach(addresses.btcOracle);
  const lendingPool = LendingPool.attach(addresses.lendingPool);

  try {
    // Check BTC Oracle price
    console.log("📊 BTC Oracle State:");
    const btcPrice = await btcOracle.getLatestPrice();
    const [price, timestamp] = await btcOracle.getPriceWithTimestamp();
    console.log("BTC Price (contract):", ethers.utils.formatUnits(btcPrice, 6), "USDC");
    console.log("Last Updated:", new Date(timestamp.toNumber() * 1000).toISOString());
    console.log("");

    // Test LTV calculation with specific values
    console.log("🧮 LTV Calculation Test:");
    const collateralAmount = ethers.utils.parseUnits("0.01", 8); // 0.01 BTC (8 decimals)
    const borrowAmount = ethers.utils.parseUnits("576.86", 6); // 576.86 USDC (6 decimals)
    
    console.log("Test Values:");
    console.log("Collateral Amount:", ethers.utils.formatUnits(collateralAmount, 8), "BTC");
    console.log("Borrow Amount:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");
    
    // Calculate collateral value using contract logic
    const collateralValueUSD = collateralAmount.mul(btcPrice).div(ethers.utils.parseUnits("1", 8));
    const maxBorrow = collateralValueUSD.mul(5000).div(10000); // 50% LTV
    
    console.log("\nContract Calculations:");
    console.log("Collateral Value USD:", ethers.utils.formatUnits(collateralValueUSD, 6));
    console.log("Max Borrow (50% LTV):", ethers.utils.formatUnits(maxBorrow, 6), "USDC");
    console.log("Requested Borrow:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");
    console.log("LTV Check:", borrowAmount.lte(maxBorrow) ? "✅ PASS" : "❌ FAIL");
    
    const actualLTV = borrowAmount.mul(10000).div(collateralValueUSD);
    console.log("Actual LTV:", actualLTV.toNumber() / 100, "%");
    
    // Check pool data
    console.log("\n💰 Pool State:");
    const poolData = await lendingPool.poolData();
    console.log("Total Supplied:", ethers.utils.formatUnits(poolData.totalSupplied, 6), "USDC");
    console.log("Total Borrowed:", ethers.utils.formatUnits(poolData.totalBorrowed, 6), "USDC");
    console.log("Available Liquidity:", ethers.utils.formatUnits(poolData.totalSupplied.sub(poolData.totalBorrowed), 6), "USDC");
    
  } catch (error) {
    console.error("❌ Error checking contract state:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });