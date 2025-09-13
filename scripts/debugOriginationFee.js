const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging origination fee issue...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const LEASING_POOL_ADDRESS = "0x42d56Ca32001C292234c778b0c81603df6b01fE4";

  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LEASING_POOL_ADDRESS);

  try {
    console.log("📊 Testing origination fee calculation:");
    
    // Test small borrow to see fee calculation  
    const borrowAmount = ethers.utils.parseUnits("100", 6); // $100 USDC
    const collateralAmount = ethers.utils.parseUnits("0.003", 8); // 0.003 bBTC (~$347, 50% LTV = $173)
    
    console.log("Borrow amount:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");
    console.log("Expected 1% fee:", "$1.00 USDC");
    console.log("Expected to receive:", "$99.00 USDC");
    
    // Check initial balances
    const initialUsdcBalance = await usdc.balanceOf(deployer.address);
    const initialTreasuryBalance = await usdc.balanceOf(deployer.address); // Treasury is deployer
    
    console.log("\n📋 Before transaction:");
    console.log("User USDC:", ethers.utils.formatUnits(initialUsdcBalance, 6));
    console.log("Treasury USDC:", ethers.utils.formatUnits(initialTreasuryBalance, 6));
    
    // Check allowance
    const currentAllowance = await bbtc.allowance(deployer.address, LEASING_POOL_ADDRESS);
    if (currentAllowance.lt(collateralAmount)) {
      console.log("\n🔄 Approving bBTC...");
      const approveTx = await bbtc.approve(LEASING_POOL_ADDRESS, collateralAmount);
      await approveTx.wait();
    }

    // Execute borrow with event listening
    console.log("\n💳 Executing borrow...");
    const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
    
    const receipt = await borrowTx.wait();
    console.log("✅ Transaction confirmed");
    
    // Parse events to see actual transfers
    console.log("\n📄 Transaction Events:");
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
          const parsed = usdc.interface.parseLog(log);
          if (parsed.name === "Transfer") {
            const from = parsed.args.from;
            const to = parsed.args.to;
            const value = parsed.args.value;
            console.log(`USDC Transfer: ${from} → ${to}: ${ethers.utils.formatUnits(value, 6)} USDC`);
          }
        }
        if (log.address.toLowerCase() === LEASING_POOL_ADDRESS.toLowerCase()) {
          const parsed = lendingPool.interface.parseLog(log);
          if (parsed.name === "Borrow") {
            console.log(`Borrow Event - Amount: ${ethers.utils.formatUnits(parsed.args.amount, 6)} USDC, Fee: ${ethers.utils.formatUnits(parsed.args.originationFee, 6)} USDC`);
          }
        }
      } catch (e) {
        // Ignore unparseable logs
      }
    }

    // Check final balances
    const finalUsdcBalance = await usdc.balanceOf(deployer.address);
    const finalTreasuryBalance = await usdc.balanceOf(deployer.address); // Same address
    
    const usdcReceived = finalUsdcBalance.sub(initialUsdcBalance);
    
    console.log("\n📈 Final Results:");
    console.log("USDC received by user:", ethers.utils.formatUnits(usdcReceived, 6), "USDC");
    console.log("Expected after fee:", "99.00 USDC");
    
    const actualFee = borrowAmount.sub(usdcReceived);
    console.log("Actual fee deducted:", ethers.utils.formatUnits(actualFee, 6), "USDC");
    console.log("Expected fee:", "1.00 USDC");

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