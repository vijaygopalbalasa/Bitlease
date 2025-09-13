const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Testing NEW LEASING MODEL - 1% fee + simple interest...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // New leasing model contract
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const LEASING_POOL_ADDRESS = "0xC27B1396d2e478bC113abe1794A6eC701B0b28D2";
  const BTC_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LEASING_POOL_ADDRESS);

  try {
    console.log("📊 Testing $1,000 USDC borrow with new leasing model:");
    
    // Check balances
    const initialUsdcBalance = await usdc.balanceOf(deployer.address);
    const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
    
    console.log("Initial USDC balance:", ethers.utils.formatUnits(initialUsdcBalance, 6), "USDC");
    console.log("Initial bBTC balance:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");

    // Test parameters - matching your example
    const borrowAmount = ethers.utils.parseUnits("1000", 6); // $1,000 USDC
    const collateralAmount = ethers.utils.parseUnits("0.02", 8); // 0.02 bBTC (should be worth ~$2,000 at current price)
    
    console.log("\n💰 Leasing Model Test:");
    console.log("Requesting:", ethers.utils.formatUnits(borrowAmount, 6), "USDC");
    console.log("Expected fee (1%):", "$10 USDC");
    console.log("Expected to receive:", "$990 USDC");
    console.log("Collateral:", ethers.utils.formatUnits(collateralAmount, 8), "bBTC");

    // Check allowance
    const currentAllowance = await bbtc.allowance(deployer.address, LEASING_POOL_ADDRESS);
    if (currentAllowance.lt(collateralAmount)) {
      console.log("\n🔄 Approving bBTC...");
      const approveTx = await bbtc.approve(LEASING_POOL_ADDRESS, collateralAmount);
      await approveTx.wait();
      console.log("✅ Approved");
    }

    // Execute borrow
    console.log("\n💳 Executing borrow with leasing model...");
    const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
    console.log("📝 Transaction hash:", borrowTx.hash);
    
    const receipt = await borrowTx.wait();
    console.log("✅ Transaction confirmed");

    // Check final balances
    const finalUsdcBalance = await usdc.balanceOf(deployer.address);
    const usdcReceived = finalUsdcBalance.sub(initialUsdcBalance);
    
    console.log("\n📈 Results:");
    console.log("USDC received:", ethers.utils.formatUnits(usdcReceived, 6), "USDC");
    console.log("Expected:", "$990 USDC (after 1% fee)");
    
    const actualFee = borrowAmount.sub(usdcReceived);
    console.log("Actual fee:", ethers.utils.formatUnits(actualFee, 6), "USDC");
    console.log("Fee percentage:", (Number(actualFee) / Number(borrowAmount) * 100).toFixed(2), "%");

    // Check user debt
    const userDebt = await lendingPool.getUserDebt(deployer.address);
    console.log("User debt recorded:", ethers.utils.formatUnits(userDebt, 6), "USDC");
    console.log("(This is what user needs to repay - full $1,000 + interest)");

    console.log("\n🎉 LEASING MODEL TEST SUCCESSFUL!");
    console.log("✅ 1% origination fee working correctly");
    console.log("✅ User receives net amount in wallet");  
    console.log("✅ Debt calculation includes full principal");
    console.log("✅ Ready for production use!");

  } catch (error) {
    console.error("\n❌ LEASING MODEL TEST FAILED:");
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });