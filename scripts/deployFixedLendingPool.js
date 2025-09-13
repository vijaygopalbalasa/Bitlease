const hre = require("hardhat");

async function main() {
  console.log("🔧 Deploying FIXED LendingPool contract...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Contract addresses
  const bBTCAddr = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE"; // Updated USDC address
  const BTCOracleAddr = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";
  
  console.log("\nContract addresses:");
  console.log("- bBTC:", bBTCAddr);
  console.log("- USDC:", USDCAddr);
  console.log("- BTC Oracle:", BTCOracleAddr);
  
  // Deploy LendingPool
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    bBTCAddr,
    USDCAddr,
    BTCOracleAddr,
    deployer.address // treasury address
  );
  
  await lendingPool.deployed();
  console.log("\n✅ FIXED LendingPool deployed to:", lendingPool.address);
  console.log("✅ Treasury set to:", deployer.address);
  
  // Fund the pool with USDC for testing
  console.log("\n💰 Adding liquidity to the pool...");
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  // Check deployer's USDC balance
  const deployerBalance = await usdc.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", hre.ethers.utils.formatUnits(deployerBalance, 6), "USDC");
  
  if (deployerBalance.gt(0)) {
    // Transfer USDC to the pool for liquidity
    const liquidityAmount = deployerBalance.div(2); // Use half of balance
    const transferTx = await usdc.transfer(lendingPool.address, liquidityAmount);
    await transferTx.wait();
    console.log("✅ Added", hre.ethers.utils.formatUnits(liquidityAmount, 6), "USDC liquidity to pool");
  } else {
    console.log("⚠️ No USDC balance found - pool will need liquidity manually");
  }
  
  // Verify the deployment
  console.log("\n🔍 Verifying deployment...");
  const poolUSDCBalance = await usdc.balanceOf(lendingPool.address);
  console.log("Pool USDC liquidity:", hre.ethers.utils.formatUnits(poolUSDCBalance, 6), "USDC");
  
  const treasuryAddress = await lendingPool.treasury();
  console.log("Treasury address:", treasuryAddress);
  
  console.log("\n🎉 FIXED CONTRACT DEPLOYMENT COMPLETE!");
  console.log("\n📋 NEXT STEPS:");
  console.log("1. Update frontend contracts.ts with new address:", lendingPool.address);
  console.log("2. Update any deployment scripts");
  console.log("3. Notify users to use the new contract");
  console.log("4. Test borrowing and repaying with new contract");
  
  console.log("\n⚠️ MIGRATION NOTE:");
  console.log("- Users will need to borrow again on the new contract");
  console.log("- Previous collateral is stuck in old contract");
  console.log("- Consider creating a migration script if needed");
  
  return {
    lendingPool: lendingPool.address,
    bBTC: bBTCAddr,
    USDC: USDCAddr,
    BTCOracle: BTCOracleAddr
  };
}

main()
  .then((addresses) => {
    console.log("\n📄 CONTRACT ADDRESSES SUMMARY:");
    Object.entries(addresses).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });