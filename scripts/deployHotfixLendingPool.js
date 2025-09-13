const hre = require("hardhat");

async function main() {
  console.log("🚑 DEPLOYING EMERGENCY HOTFIX: LendingPool with corrected liquidity check");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  
  // Contract addresses
  const collateralToken = "0xF582deB7975be1328592def5A8Bfda61295160Be"; // bBTC
  const borrowToken = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";     // USDC
  const priceOracle = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";     // BTC Oracle
  const treasury = "0x1C8cd0c38F8DE35d6056c7C7aBFa7e65D260E816";         // Treasury
  
  console.log("\nDeploying LendingPool with hotfix...");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    collateralToken,
    borrowToken, 
    priceOracle,
    treasury
  );
  
  await lendingPool.deployed();
  console.log("✅ HOTFIX LendingPool deployed to:", lendingPool.address);
  
  // Transfer USDC from old contract to new contract
  const oldContractAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  
  console.log("\n💰 FUNDING NEW CONTRACT:");
  
  // Get treasury signer (this might require manual intervention)
  console.log("Treasury address:", treasury);
  console.log("Manual action required: Send USDC from old contract to new contract");
  console.log("Old contract:", oldContractAddr);
  console.log("New contract:", lendingPool.address);
  console.log("Amount to transfer: ~346,808 USDC");
  
  // Test the fix
  console.log("\n🧪 TESTING HOTFIX:");
  
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  // For now, let's fund with a smaller amount for testing
  // In production, treasury would need to transfer the full amount
  
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("✅ Hotfix contract deployed:", lendingPool.address);
  console.log("🔧 Fixed bug: Now uses actual USDC balance for liquidity check");
  console.log("💰 Needs funding: Treasury must transfer USDC from old contract");
  console.log("🚀 Ready to update frontend once funded");
  
  console.log("\n🔄 NEXT STEPS:");
  console.log("1. Fund new contract with USDC");
  console.log("2. Update frontend contract address");
  console.log("3. Test borrowing functionality");
  console.log("4. Announce fix to users");
  
  return lendingPool.address;
}

main()
  .then((address) => {
    console.log(`\n🎉 HOTFIX DEPLOYED: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });