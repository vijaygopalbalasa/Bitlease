const hre = require("hardhat");

async function main() {
  console.log("🕵️ DEEP INVESTIGATION: Liquidity Bug Analysis");
  
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  console.log("\n1. CONTRACT LIQUIDITY ANALYSIS:");
  
  // Get pool balance directly
  const poolBalance = await usdc.balanceOf(lendingPoolAddr);
  console.log("Direct USDC balance:", hre.ethers.utils.formatUnits(poolBalance, 6), "USDC");
  
  // Check if the contract has a separate liquidity tracking
  try {
    const availableLiquidity = await lendingPool.availableLiquidity();
    console.log("Contract availableLiquidity():", hre.ethers.utils.formatUnits(availableLiquidity, 6), "USDC");
    console.log("Balances match?", poolBalance.eq(availableLiquidity));
  } catch (e) {
    console.log("No availableLiquidity() function found");
  }
  
  // Check total borrowed amount
  try {
    const totalBorrowed = await lendingPool.totalBorrowed();
    console.log("Total borrowed amount:", hre.ethers.utils.formatUnits(totalBorrowed, 6), "USDC");
  } catch (e) {
    console.log("No totalBorrowed() function found");
  }
  
  console.log("\n2. BORROW FUNCTION SIMULATION:");
  
  const collateralAmount = hre.ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC
  const borrowAmount = hre.ethers.utils.parseUnits("579.875", 6); // $579.875 USDC
  
  console.log("Simulating borrow with:");
  console.log("- Collateral:", hre.ethers.utils.formatUnits(collateralAmount, 8), "bBTC");
  console.log("- Borrow:", hre.ethers.utils.formatUnits(borrowAmount, 6), "USDC");
  
  // Try to simulate step by step
  try {
    console.log("\n3. STEP-BY-STEP VALIDATION:");
    
    // Check user's bBTC balance
    const bBTCAddr = "0xF582deB7975be1328592def5A8Bfda61295160Be";
    const bBTC = await hre.ethers.getContractFactory("ERC20");
    const bbtc = bBTC.attach(bBTCAddr);
    
    const userBBTCBalance = await bbtc.balanceOf(userAddr);
    console.log("User bBTC balance:", hre.ethers.utils.formatUnits(userBBTCBalance, 8), "bBTC");
    console.log("Has enough collateral?", userBBTCBalance.gte(collateralAmount));
    
    // Check bBTC allowance
    const allowance = await bbtc.allowance(userAddr, lendingPoolAddr);
    console.log("bBTC allowance:", hre.ethers.utils.formatUnits(allowance, 8), "bBTC");
    console.log("Allowance sufficient?", allowance.gte(collateralAmount));
    
    // Try the actual call with more detailed error
    try {
      await hre.ethers.provider.call({
        to: lendingPoolAddr,
        data: lendingPool.interface.encodeFunctionData("borrow", [collateralAmount, borrowAmount]),
        from: userAddr
      });
      console.log("✅ Borrow call succeeded in simulation");
    } catch (error) {
      console.log("❌ Borrow call failed:", error.reason || error.message);
      
      // Try to identify the exact line that's failing
      console.log("\n4. CONTRACT SOURCE ANALYSIS:");
      console.log("Most likely the issue is in one of these checks:");
      console.log("1. require(collateralAmount > 0, 'Invalid collateral amount')");
      console.log("2. require(borrowAmount > 0, 'Invalid borrow amount')"); 
      console.log("3. require(bbtcToken.transferFrom(msg.sender, address(this), collateralAmount), 'Collateral transfer failed')");
      console.log("4. require(maxBorrowAmount >= borrowAmount, 'Borrow amount too high')");
      console.log("5. require(usdcToken.balanceOf(address(this)) >= borrowAmount, 'Insufficient liquidity')"); // <-- SUSPECT
      console.log("6. require(usdcToken.transfer(msg.sender, borrowAmount), 'Transfer failed')");
      
      // The pool balance check might be looking at the wrong token or have a bug
      console.log("\n🔍 DEBUGGING THE EXACT FAILURE:");
      
      // Let's check if the contract is looking at the wrong USDC address
      const contractUSDCAddr = await lendingPool.usdcToken();
      console.log("Contract's USDC address:", contractUSDCAddr);
      console.log("Expected USDC address:", USDCAddr);
      console.log("Addresses match?", contractUSDCAddr.toLowerCase() === USDCAddr.toLowerCase());
      
      if (contractUSDCAddr.toLowerCase() !== USDCAddr.toLowerCase()) {
        console.log("🚨 FOUND THE BUG: Contract is using wrong USDC address!");
        const wrongUsdc = USDC.attach(contractUSDCAddr);
        const wrongBalance = await wrongUsdc.balanceOf(lendingPoolAddr);
        console.log("Wrong USDC balance:", hre.ethers.utils.formatUnits(wrongBalance, 6));
      }
    }
    
  } catch (error) {
    console.log("Simulation error:", error.message);
  }
  
  console.log("\n5. CONCLUSION:");
  console.log("If pool has liquidity but borrow fails, possible causes:");
  console.log("1. Wrong USDC token address in contract");
  console.log("2. Bug in liquidity check logic"); 
  console.log("3. Reentrancy guard blocking the call");
  console.log("4. Contract paused or emergency stop");
  console.log("5. Precision/rounding error in calculation");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });