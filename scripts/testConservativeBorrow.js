const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing ultra-conservative borrowing...\n");

  const [deployer] = await ethers.getSigners();

  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const FRESH_LENDING_POOL_ADDRESS = "0xC27B1396d2e478bC113abe1794A6eC701B0b28D2";
  const FRESH_ORACLE_ADDRESS = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";

  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", FRESH_LENDING_POOL_ADDRESS);
  const btcOracle = await ethers.getContractAt("BTCOracle", FRESH_ORACLE_ADDRESS);

  try {
    // Get oracle price
    const [btcPrice] = await btcOracle.getPriceWithTimestamp();
    const btcPriceUSD = Number(btcPrice) / 1e6;
    console.log("BTC Price from Oracle:", btcPriceUSD.toLocaleString(), "USD");

    // Use ultra-conservative LTV - maybe the contract expects 18 decimal oracle price?
    const collateralAmount = ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC (small amount)
    
    // Try different borrowing amounts to find what works
    const borrowAmounts = [
      ethers.utils.parseUnits("10", 6),   // 10 USDC
      ethers.utils.parseUnits("50", 6),   // 50 USDC  
      ethers.utils.parseUnits("100", 6),  // 100 USDC
      ethers.utils.parseUnits("200", 6),  // 200 USDC
      ethers.utils.parseUnits("500", 6),  // 500 USDC
    ];

    for (let i = 0; i < borrowAmounts.length; i++) {
      const borrowAmount = borrowAmounts[i];
      const borrowUSD = Number(ethers.utils.formatUnits(borrowAmount, 6));
      const collateralUSD = 0.01 * btcPriceUSD;
      const ltv = (borrowUSD / collateralUSD) * 100;
      
      console.log(`\n🧪 Test ${i + 1}: Trying to borrow ${borrowUSD} USDC`);
      console.log(`   Collateral: 0.01 BTC (${collateralUSD.toFixed(2)} USD)`);
      console.log(`   LTV: ${ltv.toFixed(2)}%`);
      
      try {
        // Check allowance
        const allowance = await bbtc.allowance(deployer.address, FRESH_LENDING_POOL_ADDRESS);
        if (allowance.lt(collateralAmount)) {
          const approveTx = await bbtc.approve(FRESH_LENDING_POOL_ADDRESS, collateralAmount);
          await approveTx.wait();
          console.log(`   ✅ Approved 0.01 bBTC`);
        }
        
        // Try borrow
        const borrowTx = await lendingPool.borrow(collateralAmount, borrowAmount);
        await borrowTx.wait();
        
        console.log(`   🎉 SUCCESS! Borrowed ${borrowUSD} USDC at ${ltv.toFixed(2)}% LTV`);
        console.log(`   🔗 Tx: https://scan.test2.btcs.network/tx/${borrowTx.hash}`);
        
        // Record what worked
        console.log("\n✅ WORKING PARAMETERS FOUND:");
        console.log(`   Collateral: 0.01 bBTC`);
        console.log(`   Borrow: ${borrowUSD} USDC`);
        console.log(`   Max LTV: ${ltv.toFixed(2)}%`);
        break;
        
      } catch (error) {
        if (error.message.includes("LTV ratio exceeded")) {
          console.log(`   ❌ LTV ${ltv.toFixed(2)}% too high`);
        } else {
          console.log(`   ❌ Error: ${error.message.substring(0, 50)}...`);
        }
      }
    }

    // Also test what the contract thinks the max LTV should be
    console.log("\n🔍 Analyzing contract LTV calculations...");
    
    try {
      // Very small borrow to see what works
      const tinyBorrow = ethers.utils.parseUnits("1", 6); // 1 USDC
      const tinyLTV = (1 / (0.01 * btcPriceUSD)) * 100;
      
      console.log(`Testing 1 USDC borrow (${tinyLTV.toFixed(4)}% LTV)...`);
      
      const tinyBorrowTx = await lendingPool.borrow(collateralAmount, tinyBorrow);
      await tinyBorrowTx.wait();
      
      console.log("✅ Even 1 USDC works! The oracle calculation might be different.");
      
    } catch (error) {
      console.log("Even 1 USDC fails:", error.message);
    }

  } catch (error) {
    console.error("Conservative test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);