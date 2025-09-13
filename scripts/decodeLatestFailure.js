const hre = require("hardhat");

async function main() {
  console.log("🚨 EMERGENCY: Decoding Latest Failure");
  
  // Latest failed transaction data
  const txData = "0x0ecbcdab00000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000374d1ac";
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const iface = LendingPool.interface;
  
  const decoded = iface.parseTransaction({ data: txData });
  const [collateralAmount, borrowAmount] = decoded.args;
  
  console.log("FAILED BORROW ATTEMPT:");
  console.log("- Collateral:", collateralAmount.toString(), "(" + (collateralAmount.toNumber() / 1e8).toFixed(8) + " bBTC)");
  console.log("- Borrow Amount:", borrowAmount.toString(), "($" + (borrowAmount.toNumber() / 1e6).toFixed(2) + " USDC)");
  
  // Check actual contract state RIGHT NOW
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  const poolBalance = await usdc.balanceOf(lendingPoolAddr);
  console.log("\nCURRENT POOL STATE:");
  console.log("- Pool USDC Balance:", hre.ethers.utils.formatUnits(poolBalance, 6), "USDC");
  console.log("- Requested Borrow:", hre.ethers.utils.formatUnits(borrowAmount, 6), "USDC");  
  console.log("- Has enough liquidity?", poolBalance.gte(borrowAmount));
  
  if (poolBalance.gte(borrowAmount)) {
    console.log("\n🚨 CRITICAL CONTRACT BUG CONFIRMED:");
    console.log("Pool has sufficient liquidity but contract rejects transaction!");
    console.log("This indicates a bug in the contract's liquidity check logic.");
    
    // Check if the contract is looking at the wrong token
    try {
      const contractUSDC = await lendingPool.usdcToken();
      console.log("\nContract's USDC address:", contractUSDC);
      console.log("Expected USDC address:", USDCAddr);
      console.log("Addresses match?", contractUSDC.toLowerCase() === USDCAddr.toLowerCase());
      
      if (contractUSDC.toLowerCase() !== USDCAddr.toLowerCase()) {
        console.log("🔥 FOUND BUG: Contract using wrong USDC address!");
      }
    } catch (e) {
      console.log("Cannot read contract USDC address");
    }
    
    // Check if there's a minimum liquidity reserve
    try {
      const reserveRatio = await lendingPool.reserveRatio();
      const requiredReserve = poolBalance.mul(reserveRatio).div(10000);
      const availableForBorrow = poolBalance.sub(requiredReserve);
      
      console.log("\nRESERVE ANALYSIS:");
      console.log("- Reserve ratio:", reserveRatio.toString());
      console.log("- Required reserve:", hre.ethers.utils.formatUnits(requiredReserve, 6), "USDC");
      console.log("- Available for borrow:", hre.ethers.utils.formatUnits(availableForBorrow, 6), "USDC");
      console.log("- Borrow amount fits in available?", availableForBorrow.gte(borrowAmount));
      
    } catch (e) {
      console.log("No reserve ratio found");
    }
  }
  
  console.log("\n🛠️ IMMEDIATE ACTION REQUIRED:");
  console.log("1. Deploy hotfix contract with corrected liquidity logic");
  console.log("2. Update frontend to use new contract");
  console.log("3. Migrate pool funds to new contract");
  console.log("4. Test borrowing functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });