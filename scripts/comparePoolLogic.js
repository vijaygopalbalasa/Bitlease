const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Comparing pool implementations...\n");

  const [deployer] = await ethers.getSigners();

  const OLD_LENDING_POOL_ADDRESS = "0xbcbF2F2aA5D6551d6E048AabD3Ea204115E57AF7";
  const NEW_LENDING_POOL_ADDRESS = "0x485BD8041f358a20df5Ae5eb9910c1e011Bf6f1e";
  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";

  try {
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const oldPool = await ethers.getContractAt("LendingPool", OLD_LENDING_POOL_ADDRESS);
    const newPool = await ethers.getContractAt("LendingPool", NEW_LENDING_POOL_ADDRESS);

    console.log("📊 Comparing pools:");
    
    // Check USDC balances
    const oldPoolBalance = await usdc.balanceOf(OLD_LENDING_POOL_ADDRESS);
    const newPoolBalance = await usdc.balanceOf(NEW_LENDING_POOL_ADDRESS);
    
    console.log("Old pool USDC balance:", ethers.utils.formatUnits(oldPoolBalance, 6), "USDC");
    console.log("New pool USDC balance:", ethers.utils.formatUnits(newPoolBalance, 6), "USDC");

    // The lending pool might need liquidity to be "supplied" through a supply function
    // rather than just transferred directly
    
    console.log("\n🔍 Checking if old pool has supply mechanism...");
    
    try {
      // Check if there's a supply function
      const deployerBalance = await usdc.balanceOf(deployer.address);
      console.log("Deployer USDC balance:", ethers.utils.formatUnits(deployerBalance, 6), "USDC");
      
      // Try to supply liquidity to new pool properly
      console.log("\n💧 Supplying liquidity to new pool properly...");
      
      const supplyAmount = ethers.utils.parseUnits("10000", 6); // 10k USDC
      
      // First approve the pool to spend USDC
      const approveTx = await usdc.approve(NEW_LENDING_POOL_ADDRESS, supplyAmount);
      await approveTx.wait();
      console.log("✅ Approved USDC for supply");
      
      // Now try to supply (this is the correct way to add liquidity)
      const supplyTx = await newPool.supply(supplyAmount);
      await supplyTx.wait();
      
      console.log("✅ Supplied 10,000 USDC properly!");
      console.log("🔗 Supply Tx:", `https://scan.test2.btcs.network/tx/${supplyTx.hash}`);
      
      // Now test borrowing
      console.log("\n🧪 Testing borrow after proper supply...");
      
      const bbtc = await ethers.getContractAt("IERC20", "0xF582deB7975be1328592def5A8Bfda61295160Be");
      const collateralAmount = ethers.utils.parseUnits("0.01", 8); // 0.01 bBTC
      const borrowAmount = ethers.utils.parseUnits("100", 6); // 100 USDC
      
      // Approve bBTC
      const bbtcApproveTx = await bbtc.approve(NEW_LENDING_POOL_ADDRESS, collateralAmount);
      await bbtcApproveTx.wait();
      
      // Now try borrowing
      const borrowTx = await newPool.borrow(collateralAmount, borrowAmount);
      await borrowTx.wait();
      
      console.log("🎉 BORROWING SUCCESSFUL!");
      console.log("🔗 Borrow Tx:", `https://scan.test2.btcs.network/tx/${borrowTx.hash}`);
      
    } catch (error) {
      console.log("Supply/borrow test failed:", error.message);
      
      if (error.message.includes("supply")) {
        console.log("🔍 Pool might not have a supply function");
      }
    }
    
  } catch (error) {
    console.error("Pool comparison failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);