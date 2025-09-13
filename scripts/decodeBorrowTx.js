const hre = require("hardhat");

async function main() {
  console.log("🔍 DECODING FAILED BORROW TRANSACTION");
  
  // Transaction data from the error
  const txData = "0x0ecbcdab00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000229030b8";
  
  // Get contract interface
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const iface = LendingPool.interface;
  
  try {
    // Decode the transaction data
    const decoded = iface.parseTransaction({ data: txData });
    console.log("Function:", decoded.name);
    console.log("Arguments:", decoded.args);
    
    if (decoded.name === "borrow") {
      const [collateralAmount, borrowAmount] = decoded.args;
      console.log("\n📊 BORROW REQUEST DETAILS:");
      console.log("- Collateral Amount:", collateralAmount.toString(), "(" + (collateralAmount.toNumber() / 1e8).toFixed(8) + " bBTC)");
      console.log("- Borrow Amount:", borrowAmount.toString(), "($" + (borrowAmount.toNumber() / 1e6).toFixed(2) + " USDC)");
      
      // Check current pool state
      const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
      const lendingPool = LendingPool.attach(lendingPoolAddr);
      
      const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
      const USDC = await hre.ethers.getContractFactory("ERC20");
      const usdc = USDC.attach(USDCAddr);
      
      const poolBalance = await usdc.balanceOf(lendingPoolAddr);
      console.log("\n💰 CURRENT POOL STATE:");
      console.log("- Pool USDC Balance:", poolBalance.toString(), "($" + hre.ethers.utils.formatUnits(poolBalance, 6) + " USDC)");
      console.log("- Requested Borrow:", borrowAmount.toString(), "($" + hre.ethers.utils.formatUnits(borrowAmount, 6) + " USDC)");
      console.log("- Pool has enough liquidity?", poolBalance.gte(borrowAmount));
      
      if (poolBalance.lt(borrowAmount)) {
        console.log("\n🚨 LIQUIDITY SHORTFALL:");
        const shortfall = borrowAmount.sub(poolBalance);
        console.log("- Shortfall:", shortfall.toString(), "($" + hre.ethers.utils.formatUnits(shortfall, 6) + " USDC)");
        console.log("- Pool needs:", hre.ethers.utils.formatUnits(borrowAmount, 6), "USDC");
        console.log("- Pool has:", hre.ethers.utils.formatUnits(poolBalance, 6), "USDC");
      }
      
      // Check if there are any other borrows that reduced liquidity
      console.log("\n🔍 INVESTIGATING LIQUIDITY DRAIN:");
      
      // Get recent transfer events from the pool
      const filter = usdc.filters.Transfer(lendingPoolAddr, null);
      const events = await usdc.queryFilter(filter, -1000); // Last 1000 blocks
      
      console.log("Recent USDC transfers FROM pool:", events.length);
      events.slice(-5).forEach((event, i) => {
        console.log(`  ${i+1}. To: ${event.args.to}, Amount: $${hre.ethers.utils.formatUnits(event.args.value, 6)} USDC`);
      });
    }
  } catch (error) {
    console.log("❌ Failed to decode:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });