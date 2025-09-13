const hre = require("hardhat");

async function main() {
  console.log("🧪 TESTING EXACT FRONTEND BORROW PARAMETERS");
  
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  // These are the exact parameters from the failed transaction
  const collateralAmount = "1000000"; // 0.01 bBTC (8 decimals)
  const borrowAmount = "579875000"; // $579.875 USDC (6 decimals)
  
  console.log("Parameters from failed transaction:");
  console.log("- Collateral:", collateralAmount, "wei (0.01 bBTC)");
  console.log("- Borrow:", borrowAmount, "wei ($579.875 USDC)");
  
  // Test multiple scenarios
  console.log("\n🔍 SCENARIO TESTING:");
  
  // Scenario 1: Basic simulation (static call)
  console.log("\n1. STATIC CALL SIMULATION:");
  try {
    const result = await hre.ethers.provider.call({
      to: lendingPoolAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
      from: userAddr
    });
    console.log("✅ Static call succeeded");
  } catch (error) {
    console.log("❌ Static call failed:", error.reason || error.message);
  }
  
  // Scenario 2: Gas estimation
  console.log("\n2. GAS ESTIMATION TEST:");
  try {
    const gasEstimate = await hre.ethers.provider.estimateGas({
      to: lendingPoolAddr,
      data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
      from: userAddr
    });
    console.log("✅ Gas estimation succeeded:", gasEstimate.toString());
  } catch (error) {
    console.log("❌ Gas estimation failed:", error.reason || error.message);
    console.log("This is likely where the frontend error occurs!");
  }
  
  // Scenario 3: Check current state vs when frontend made the call
  console.log("\n3. CURRENT STATE CHECK:");
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  const currentBalance = await usdc.balanceOf(lendingPoolAddr);
  console.log("Current pool USDC balance:", hre.ethers.utils.formatUnits(currentBalance, 6), "USDC");
  console.log("Required for borrow:", hre.ethers.utils.formatUnits(borrowAmount, 6), "USDC");
  console.log("Sufficient liquidity?", currentBalance.gte(borrowAmount));
  
  // Scenario 4: Check if someone else borrowed in the meantime
  console.log("\n4. RECENT ACTIVITY CHECK:");
  try {
    // Check for recent borrow events
    const filter = lendingPool.filters.Borrow();
    const events = await lendingPool.queryFilter(filter, -100); // Last 100 blocks
    console.log("Recent borrow events:", events.length);
    
    if (events.length > 0) {
      console.log("Most recent borrows:");
      events.slice(-3).forEach((event, i) => {
        console.log(`  ${i+1}. User: ${event.args.user}, Amount: $${hre.ethers.utils.formatUnits(event.args.borrowAmount, 6)} USDC`);
      });
    }
  } catch (e) {
    console.log("Could not fetch borrow events");
  }
  
  // Scenario 5: Check USDC transfers out of pool
  console.log("\n5. USDC OUTFLOW CHECK:");
  const transferFilter = usdc.filters.Transfer(lendingPoolAddr, null);
  const transferEvents = await usdc.queryFilter(transferFilter, -50); // Last 50 blocks
  console.log("Recent USDC transfers FROM pool:", transferEvents.length);
  
  if (transferEvents.length > 0) {
    console.log("Recent outflows:");
    transferEvents.slice(-5).forEach((event, i) => {
      const block = event.blockNumber;
      const amount = hre.ethers.utils.formatUnits(event.args.value, 6);
      console.log(`  ${i+1}. Block ${block}: $${amount} USDC to ${event.args.to}`);
    });
  }
  
  console.log("\n📋 DIAGNOSIS:");
  console.log("If static call succeeds but gas estimation fails, the issue is:");
  console.log("1. State change between calls (someone borrowed)");
  console.log("2. Gas price/limit issues");
  console.log("3. Mempool ordering problems");
  console.log("4. Block timestamp dependencies");
  
  console.log("\n💡 RECOMMENDED ACTIONS:");
  console.log("1. Try borrowing a smaller amount ($500 instead of $579.875)");
  console.log("2. Check if someone else borrowed recently");  
  console.log("3. Refresh the page and try again");
  console.log("4. Increase gas limit in MetaMask");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });