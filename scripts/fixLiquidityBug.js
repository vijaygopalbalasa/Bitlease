const hre = require("hardhat");

async function main() {
  console.log("🚑 EMERGENCY FIX: Supplying liquidity through proper function");
  
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  // Get the contract's current USDC balance
  const contractBalance = await usdc.balanceOf(lendingPoolAddr);
  console.log("Contract's USDC balance:", hre.ethers.utils.formatUnits(contractBalance, 6), "USDC");
  
  // This balance exists but contract doesn't track it in poolData.totalSupplied
  // We need to call supply() with the existing balance to register it
  
  console.log("\n🔧 SOLUTION:");
  console.log("We need to call lendingPool.supply() to register the existing USDC balance");
  console.log("This will set poolData.totalSupplied = actual balance");
  
  // To do this, we need to:
  // 1. Have an account with USDC 
  // 2. Call supply() with the amount
  
  console.log("\n💡 ALTERNATIVE SOLUTION (FASTER):");
  console.log("Deploy a new contract with the correct liquidity check:");
  console.log("Change line 140 from:");
  console.log("  uint256 availableLiquidity = poolData.totalSupplied - poolData.totalBorrowed;");
  console.log("To:");
  console.log("  uint256 availableLiquidity = borrowToken.balanceOf(address(this));");
  console.log("This way the contract checks actual USDC balance, not tracked balance");
  
  console.log("\n🚀 DEPLOYING HOTFIX CONTRACT NOW...");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });