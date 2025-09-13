const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing USDC borrowing with bBTC collateral...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const LENDING_POOL_ADDRESS = "0xC27B1396d2e478bC113abe1794A6eC701B0b28D2";
  const BTC_CONSUMER_ADDRESS = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e";

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LENDING_POOL_ADDRESS);
  
  // BTC Consumer ABI for price checking
  const btcConsumer = await ethers.getContractAt([
    "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)"
  ], BTC_CONSUMER_ADDRESS);

  console.log("📋 Initial balances:");
  const initialUsdcBalance = await usdc.balanceOf(deployer.address);
  const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
  console.log("USDC:", ethers.utils.formatUnits(initialUsdcBalance, 6), "USDC");
  console.log("bBTC:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");

  // Check BTC price from consumer
  console.log("\n📊 BTC Oracle Status:");
  const [btcPrice, timestamp, isStale] = await btcConsumer.viewLatestPrice();
  const btcPriceUSD = Number(btcPrice) / 1e18;
  console.log("BTC Price:", btcPriceUSD.toLocaleString(), "USD");
  console.log("Last Updated:", new Date(timestamp * 1000).toLocaleString());
  console.log("Is Stale:", isStale);

  // Test borrowing with 0.05 BTC collateral
  const collateralAmount = ethers.utils.parseUnits("0.05", 8); // 0.05 bBTC
  const collateralValueUSD = (0.05 * btcPriceUSD);
  const maxBorrowUSD = collateralValueUSD * 0.50; // 50% LTV
  const borrowAmount = ethers.utils.parseUnits(maxBorrowUSD.toFixed(6), 6);

  console.log("\n📋 Borrowing calculation:");
  console.log("Collateral:", ethers.utils.formatUnits(collateralAmount, 8), "bBTC");
  console.log("Collateral Value:", collateralValueUSD.toLocaleString(), "USD");
  console.log("Max Borrow (50% LTV):", maxBorrowUSD.toFixed(2), "USDC");
  console.log("Borrow Amount:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");

  try {
    // Approve bBTC for lending pool
    console.log("\n1. Approving bBTC collateral...");
    const approveTx = await bbtc.approve(LENDING_POOL_ADDRESS, collateralAmount);
    await approveTx.wait();
    console.log("✅ Approved");

    // Borrow USDC
    console.log("2. Borrowing USDC...");
    const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
    await borrowTx.wait();
    console.log("✅ Borrowed successfully");

    // Check new balances
    console.log("\n💰 Final balances:");
    const finalUsdcBalance = await usdc.balanceOf(deployer.address);
    const finalBbtcBalance = await bbtc.balanceOf(deployer.address);
    console.log("USDC:", ethers.utils.formatUnits(finalUsdcBalance, 6), "USDC");
    console.log("bBTC:", ethers.utils.formatUnits(finalBbtcBalance, 8), "bBTC");

    console.log("\n📈 Changes:");
    const usdcGained = finalUsdcBalance.sub(initialUsdcBalance);
    const bbtcUsed = initialBbtcBalance.sub(finalBbtcBalance);
    console.log("USDC gained:", ethers.utils.formatUnits(usdcGained, 6), "USDC");
    console.log("bBTC used as collateral:", ethers.utils.formatUnits(bbtcUsed, 8), "bBTC");

    console.log("\n🎉 BORROWING TEST SUCCESSFUL!");
    console.log("✅ No LTV calculation mismatches");
    console.log("✅ Oracle integration working correctly");

  } catch (error) {
    console.error("❌ BORROWING TEST FAILED:");
    console.error(error.message);
    
    if (error.message.includes("LTV ratio exceeded")) {
      console.log("\n🔍 LTV Analysis:");
      console.log("This suggests a calculation mismatch between frontend and contract");
      console.log("Contract BTC price might differ from oracle price");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });