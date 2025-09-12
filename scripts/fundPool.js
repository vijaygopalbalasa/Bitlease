const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Funding Lending Pool with USDC...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Funding with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "tCORE\n");

  // Contract addresses from deployed-addresses.json
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const LENDING_POOL_ADDRESS = "0xbcbF2F2aA5D6551d6E048AabD3Ea204115E57AF7";

  // Get contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LENDING_POOL_ADDRESS);

  // Check current pool balance
  const poolBalance = await usdc.balanceOf(LENDING_POOL_ADDRESS);
  console.log("Current pool USDC balance:", ethers.utils.formatUnits(poolBalance, 6), "USDC");

  // Check deployer USDC balance
  const deployerBalance = await usdc.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.utils.formatUnits(deployerBalance, 6), "USDC");

  // Supply 50,000 USDC to the pool for lending
  const supplyAmount = ethers.utils.parseUnits("50000", 6); // 50,000 USDC

  console.log("\n📋 Supplying 50,000 USDC to lending pool...");
  
  // Approve USDC for the lending pool
  console.log("1. Approving USDC...");
  const approveTx = await usdc.approve(LENDING_POOL_ADDRESS, supplyAmount);
  await approveTx.wait();
  console.log("✅ Approved");

  // Supply USDC to the pool
  console.log("2. Supplying USDC to pool...");
  const supplyTx = await lendingPool.supply(supplyAmount);
  await supplyTx.wait();
  console.log("✅ Supplied");

  // Check new pool balance
  const newPoolBalance = await usdc.balanceOf(LENDING_POOL_ADDRESS);
  console.log("\n💰 New pool USDC balance:", ethers.utils.formatUnits(newPoolBalance, 6), "USDC");

  console.log("\n🎉 FUNDING COMPLETE!");
  console.log("Users can now borrow USDC from the pool using bBTC collateral");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });