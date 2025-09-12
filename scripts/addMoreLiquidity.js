const { ethers } = require("hardhat");

async function main() {
  console.log("💧 Adding more liquidity to fresh lending pool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", deployer.address);

  const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  const FRESH_LENDING_POOL_ADDRESS = "0x485BD8041f358a20df5Ae5eb9910c1e011Bf6f1e";

  try {
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    
    // Check balances
    const deployerBalance = await usdc.balanceOf(deployer.address);
    const poolBalance = await usdc.balanceOf(FRESH_LENDING_POOL_ADDRESS);
    
    console.log("Deployer USDC balance:", ethers.utils.formatUnits(deployerBalance, 6), "USDC");
    console.log("Current pool USDC:", ethers.utils.formatUnits(poolBalance, 6), "USDC");
    
    // Add 200k more USDC
    const additionalLiquidity = ethers.utils.parseUnits("200000", 6); // 200k USDC
    
    if (deployerBalance.gte(additionalLiquidity)) {
      console.log("\n💧 Adding 200,000 USDC liquidity...");
      
      const transferTx = await usdc.transfer(FRESH_LENDING_POOL_ADDRESS, additionalLiquidity);
      console.log("✅ Transfer sent:", transferTx.hash);
      console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${transferTx.hash}`);
      
      await transferTx.wait();
      console.log("✅ Liquidity added successfully");
      
      // Check new balance
      const newPoolBalance = await usdc.balanceOf(FRESH_LENDING_POOL_ADDRESS);
      console.log("New pool USDC:", ethers.utils.formatUnits(newPoolBalance, 6), "USDC");
      
      console.log("\n✅ Pool is now ready for borrowing!");
      
    } else {
      console.log("❌ Not enough USDC balance for additional liquidity");
    }

  } catch (error) {
    console.error("❌ Failed to add liquidity:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });