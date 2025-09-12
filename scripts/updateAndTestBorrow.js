const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing borrowing flow with price update...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const LENDING_POOL_ADDRESS = "0xbcbF2F2aA5D6551d6E048AabD3Ea204115E57AF7";
  const BTC_CONSUMER_ADDRESS = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e";

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LENDING_POOL_ADDRESS);
  
  // BTC Consumer for price checking and updating
  const btcConsumer = await ethers.getContractAt([
    "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)",
    "function updatePrice() external"
  ], BTC_CONSUMER_ADDRESS);

  console.log("📊 Current BTC price status:");
  const [btcPrice, timestamp, isStale] = await btcConsumer.viewLatestPrice();
  const btcPriceUSD = Number(btcPrice) / 1e18;
  console.log("BTC Price:", btcPriceUSD.toLocaleString(), "USD");
  console.log("Last Updated:", new Date(timestamp * 1000).toLocaleString());
  console.log("Is Stale:", isStale);

  if (isStale) {
    console.log("\n🔄 Price is stale, updating...");
    try {
      const updateTx = await btcConsumer.updatePrice();
      console.log("✅ Price update transaction sent:", updateTx.hash);
      console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${updateTx.hash}`);
      
      await updateTx.wait();
      console.log("✅ Price update confirmed");
      
      // Check new price
      const [newPrice, newTimestamp, newIsStale] = await btcConsumer.viewLatestPrice();
      const newBtcPriceUSD = Number(newPrice) / 1e18;
      console.log("New BTC Price:", newBtcPriceUSD.toLocaleString(), "USD");
      console.log("New Timestamp:", new Date(newTimestamp * 1000).toLocaleString());
      console.log("Is Still Stale:", newIsStale);
    } catch (error) {
      console.error("❌ Failed to update price:", error.message);
      return;
    }
  } else {
    console.log("✅ Price is fresh, no update needed");
  }

  // Now proceed with borrowing test
  console.log("\n📋 Testing borrowing flow:");
  const initialUsdcBalance = await usdc.balanceOf(deployer.address);
  const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
  
  console.log("USDC balance:", ethers.utils.formatUnits(initialUsdcBalance, 6), "USDC");
  console.log("bBTC balance:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");

  // Test parameters
  const collateralAmount = ethers.utils.parseUnits("0.05", 8); // 0.05 bBTC
  const collateralValueUSD = (0.05 * btcPriceUSD);
  const maxBorrowUSD = collateralValueUSD * 0.50; // 50% LTV
  const borrowAmount = ethers.utils.parseUnits(maxBorrowUSD.toFixed(6), 6);

  console.log("Collateral:", ethers.utils.formatUnits(collateralAmount, 8), "bBTC");
  console.log("Max Borrow:", maxBorrowUSD.toFixed(2), "USDC");

  try {
    // Check and approve if needed
    const currentAllowance = await bbtc.allowance(deployer.address, LENDING_POOL_ADDRESS);
    if (currentAllowance.lt(collateralAmount)) {
      console.log("\n🔄 Approving bBTC...");
      const approveTx = await bbtc.approve(LENDING_POOL_ADDRESS, collateralAmount);
      await approveTx.wait();
      console.log("✅ Approved");
    }

    // Execute borrowing
    console.log("\n💰 Executing borrow...");
    const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
    console.log("✅ Borrow transaction sent:", borrowTx.hash);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${borrowTx.hash}`);
    
    await borrowTx.wait();
    console.log("✅ Borrow confirmed");

    // Check final balances
    const finalUsdcBalance = await usdc.balanceOf(deployer.address);
    const finalBbtcBalance = await bbtc.balanceOf(deployer.address);
    
    const usdcGained = finalUsdcBalance.sub(initialUsdcBalance);
    const bbtcUsed = initialBbtcBalance.sub(finalBbtcBalance);
    
    console.log("\n📈 Results:");
    console.log("USDC gained:", ethers.utils.formatUnits(usdcGained, 6), "USDC");
    console.log("bBTC used:", ethers.utils.formatUnits(bbtcUsed, 8), "bBTC");

    console.log("\n🎉 COMPLETE BORROWING FLOW SUCCESSFUL!");
    console.log("✅ Price oracle working");
    console.log("✅ Approval system working");
    console.log("✅ Borrowing logic working");

  } catch (error) {
    console.error("\n❌ BORROWING FAILED:");
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });