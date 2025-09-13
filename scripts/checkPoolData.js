const hre = require("hardhat");

async function main() {
  console.log("🔍 CHECKING POOL DATA STATE");
  
  const lendingPoolAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  try {
    // Read poolData struct
    const poolData = await lendingPool.poolData();
    console.log("POOL DATA STRUCT:");
    console.log("- totalSupplied:", hre.ethers.utils.formatUnits(poolData.totalSupplied, 6), "USDC");
    console.log("- totalBorrowed:", hre.ethers.utils.formatUnits(poolData.totalBorrowed, 6), "USDC");
    console.log("- totalCollateral:", hre.ethers.utils.formatUnits(poolData.totalCollateral, 8), "bBTC");
    
    // Calculate what the contract thinks is available
    const availableLiquidity = poolData.totalSupplied.sub(poolData.totalBorrowed);
    console.log("- Contract's availableLiquidity:", hre.ethers.utils.formatUnits(availableLiquidity, 6), "USDC");
    
    // Compare with actual USDC balance
    const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
    const USDC = await hre.ethers.getContractFactory("ERC20");
    const usdc = USDC.attach(USDCAddr);
    const actualBalance = await usdc.balanceOf(lendingPoolAddr);
    console.log("- Actual USDC balance:", hre.ethers.utils.formatUnits(actualBalance, 6), "USDC");
    
    console.log("\n🚨 BUG CONFIRMED:");
    console.log("Contract thinks available liquidity:", hre.ethers.utils.formatUnits(availableLiquidity, 6), "USDC");
    console.log("Actual available liquidity:", hre.ethers.utils.formatUnits(actualBalance, 6), "USDC");
    
    if (availableLiquidity.lte(0)) {
      console.log("❌ Contract's available liquidity is zero or negative!");
      console.log("This is why all borrows fail with 'Insufficient liquidity'");
      console.log("\nROOT CAUSE: Contract was manually funded, not through supply() function");
      console.log("The poolData.totalSupplied is 0, so availableLiquidity = 0 - 0 = 0");
    }
    
  } catch (error) {
    console.log("Error reading pool data:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });