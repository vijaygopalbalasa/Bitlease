const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing small borrow amount...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const FRESH_LENDING_POOL_ADDRESS = "0x485BD8041f358a20df5Ae5eb9910c1e011Bf6f1e";

  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", FRESH_LENDING_POOL_ADDRESS);

  try {
    // Try very small amounts
    console.log("📊 Pool status:");
    const poolBalance = await usdc.balanceOf(FRESH_LENDING_POOL_ADDRESS);
    console.log("Pool USDC:", ethers.utils.formatUnits(poolBalance, 6), "USDC");

    // Try borrowing just 100 USDC with 0.01 BTC collateral
    const smallCollateral = ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC
    const smallBorrow = ethers.utils.parseUnits("100", 6); // 100 USDC

    console.log("Testing small borrow:");
    console.log("Collateral:", ethers.utils.formatUnits(smallCollateral, 8), "bBTC");
    console.log("Borrow:", ethers.utils.formatUnits(smallBorrow, 6), "USDC");

    // Check allowance for small amount
    const allowance = await bbtc.allowance(deployer.address, FRESH_LENDING_POOL_ADDRESS);
    if (allowance.lt(smallCollateral)) {
      console.log("Approving small collateral...");
      const approveTx = await bbtc.approve(FRESH_LENDING_POOL_ADDRESS, smallCollateral);
      await approveTx.wait();
      console.log("✅ Approved");
    }

    // Try the small borrow
    console.log("Attempting small borrow...");
    const borrowTx = await lendingPool.borrow(smallCollateral, smallBorrow);
    await borrowTx.wait();
    
    console.log("✅ Small borrow successful!");
    console.log("🔗 Tx:", `https://scan.test2.btcs.network/tx/${borrowTx.hash}`);

  } catch (error) {
    console.error("Small borrow failed:", error.message);
    
    // Check if this is a pool initialization issue
    console.log("\n🔍 Checking pool implementation...");
    try {
      // Try to understand the pool's liquidity mechanism
      const poolData = await lendingPool.getPoolData();
      console.log("Pool data:", poolData);
    } catch (error2) {
      console.log("Cannot read pool data - might need different approach");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);