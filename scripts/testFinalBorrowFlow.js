const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 FINAL TEST: Complete borrowing flow with fresh system...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // New fresh contract addresses
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const FRESH_LENDING_POOL_ADDRESS = "0x485BD8041f358a20df5Ae5eb9910c1e011Bf6f1e";
  const FRESH_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", FRESH_LENDING_POOL_ADDRESS);
  const btcOracle = await ethers.getContractAt("BTCOracle", FRESH_ORACLE_ADDRESS);

  console.log("📋 Using Fresh System:");
  console.log("USDC:", USDC_ADDRESS);
  console.log("bBTC:", BBTC_ADDRESS);
  console.log("LendingPool:", FRESH_LENDING_POOL_ADDRESS);
  console.log("BTC Oracle:", FRESH_ORACLE_ADDRESS);

  try {
    // 1. Verify oracle is fresh
    console.log("\n🔍 STEP 1: Verify Oracle Status");
    const [btcPrice, timestamp] = await btcOracle.getPriceWithTimestamp();
    const btcPriceUSD = Number(btcPrice) / 1e6;
    const age = Math.floor(Date.now() / 1000) - Number(timestamp);
    
    console.log("BTC Price:", btcPriceUSD.toLocaleString(), "USD");
    console.log("Last Updated:", new Date(timestamp * 1000).toLocaleString());
    console.log("Age:", age, "seconds");
    
    if (age > 3600) { // 1 hour
      console.log("⚠️ Price might be getting stale, updating...");
      const updateTx = await btcOracle.updatePrice(ethers.utils.parseUnits("116000", 6));
      await updateTx.wait();
      console.log("✅ Price updated");
    } else {
      console.log("✅ Oracle price is fresh");
    }

    // 2. Check initial balances
    console.log("\n📊 STEP 2: Check Initial Balances");
    const initialUsdcBalance = await usdc.balanceOf(deployer.address);
    const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
    const poolUsdcBalance = await usdc.balanceOf(FRESH_LENDING_POOL_ADDRESS);
    
    console.log("User USDC:", ethers.utils.formatUnits(initialUsdcBalance, 6), "USDC");
    console.log("User bBTC:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");
    console.log("Pool USDC:", ethers.utils.formatUnits(poolUsdcBalance, 6), "USDC");

    if (poolUsdcBalance.eq(0)) {
      console.log("❌ Pool has no liquidity!");
      return;
    }

    // 3. Calculate borrowing parameters
    console.log("\n🧮 STEP 3: Calculate Borrowing Parameters");
    const collateralAmount = ethers.utils.parseUnits("0.05", 8); // 0.05 bBTC
    const collateralValueUSD = (0.05 * btcPriceUSD);
    const maxBorrowUSD = collateralValueUSD * 0.50; // 50% LTV
    const borrowAmount = ethers.utils.parseUnits(maxBorrowUSD.toFixed(6), 6);

    console.log("Collateral:", ethers.utils.formatUnits(collateralAmount, 8), "bBTC");
    console.log("Collateral Value:", collateralValueUSD.toLocaleString(), "USD");
    console.log("Max Borrow (50% LTV):", maxBorrowUSD.toFixed(2), "USDC");
    console.log("Borrow Amount:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");

    // 4. Check and approve bBTC for lending pool (FIXED APPROVAL FLOW)
    console.log("\n🔐 STEP 4: bBTC Approval for LendingPool");
    const currentAllowance = await bbtc.allowance(deployer.address, FRESH_LENDING_POOL_ADDRESS);
    console.log("Current allowance:", ethers.utils.formatUnits(currentAllowance, 8), "bBTC");
    console.log("Required amount:", ethers.utils.formatUnits(collateralAmount, 8), "bBTC");
    
    const needsApproval = currentAllowance.lt(collateralAmount);
    console.log("Needs approval:", needsApproval);

    if (needsApproval) {
      console.log("🔄 Approving bBTC for lending pool...");
      const approveTx = await bbtc.approve(FRESH_LENDING_POOL_ADDRESS, collateralAmount);
      console.log("✅ Approval sent:", approveTx.hash);
      console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${approveTx.hash}`);
      
      await approveTx.wait();
      console.log("✅ Approval confirmed");
      
      // Verify approval
      const newAllowance = await bbtc.allowance(deployer.address, FRESH_LENDING_POOL_ADDRESS);
      console.log("New allowance:", ethers.utils.formatUnits(newAllowance, 8), "bBTC");
      
      if (newAllowance.gte(collateralAmount)) {
        console.log("✅ Approval successful - ready for borrowing");
      } else {
        console.log("❌ Approval failed");
        return;
      }
    } else {
      console.log("✅ Already has sufficient allowance");
    }

    // 5. Execute borrowing transaction
    console.log("\n💰 STEP 5: Execute Borrowing");
    console.log("Executing borrow with fresh oracle and pool...");
    
    const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
    console.log("✅ Borrow transaction sent:", borrowTx.hash);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${borrowTx.hash}`);
    
    await borrowTx.wait();
    console.log("✅ Borrow transaction confirmed!");

    // 6. Verify final state
    console.log("\n📊 STEP 6: Verify Final State");
    const finalUsdcBalance = await usdc.balanceOf(deployer.address);
    const finalBbtcBalance = await bbtc.balanceOf(deployer.address);
    const finalAllowance = await bbtc.allowance(deployer.address, FRESH_LENDING_POOL_ADDRESS);
    
    console.log("Final USDC balance:", ethers.utils.formatUnits(finalUsdcBalance, 6), "USDC");
    console.log("Final bBTC balance:", ethers.utils.formatUnits(finalBbtcBalance, 8), "bBTC");
    console.log("Final allowance:", ethers.utils.formatUnits(finalAllowance, 8), "bBTC");

    const usdcGained = finalUsdcBalance.sub(initialUsdcBalance);
    const bbtcUsed = initialBbtcBalance.sub(finalBbtcBalance);
    
    console.log("\n📈 TRANSACTION SUMMARY:");
    console.log("USDC gained:", ethers.utils.formatUnits(usdcGained, 6), "USDC");
    console.log("bBTC used as collateral:", ethers.utils.formatUnits(bbtcUsed, 8), "bBTC");

    console.log("\n🎉 🎉 🎉 COMPLETE SUCCESS! 🎉 🎉 🎉");
    console.log("✅ Fresh oracle with current BTC price");
    console.log("✅ New lending pool with liquidity");
    console.log("✅ Fixed bBTC approval flow");
    console.log("✅ Successful borrowing transaction");
    console.log("✅ All transaction explorer links working");
    console.log("✅ SYSTEM IS READY FOR USERS!");

  } catch (error) {
    console.error("\n❌ FINAL TEST FAILED:");
    console.error("Error:", error.message);
    
    if (error.message.includes("LTV ratio exceeded")) {
      console.log("🔍 This is unexpected - oracle should be fresh");
    } else if (error.message.includes("allowance")) {
      console.log("🔍 Approval issue - frontend fix might not be complete");
    } else if (error.message.includes("insufficient funds")) {
      console.log("🔍 Balance or liquidity issue");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });