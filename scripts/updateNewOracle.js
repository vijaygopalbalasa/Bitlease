const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Updating new BTC oracle price...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Updating price with account:", deployer.address);

  // New oracle address that we just deployed
  const btcOracleAddress = "0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C";

  // Get contract instance
  const BTCOracle = await ethers.getContractFactory("BTCOracle");
  const btcOracle = BTCOracle.attach(btcOracleAddress);

  try {
    // Check current price
    const currentPrice = await btcOracle.getLatestPrice();
    console.log("📊 Current BTC price:", ethers.utils.formatUnits(currentPrice, 6), "USDC");
    
    // Set new price to match market (around $115,975)
    const newPrice = ethers.utils.parseUnits("115975", 6); // $115,975 with 6 decimals
    
    console.log("🔄 Updating to new price:", ethers.utils.formatUnits(newPrice, 6), "USDC");
    
    const tx = await btcOracle.updatePrice(newPrice);
    await tx.wait();
    
    console.log("✅ BTC price updated successfully!");
    console.log("📝 Transaction hash:", tx.hash);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${tx.hash}`);
    
    // Verify the update
    const updatedPrice = await btcOracle.getLatestPrice();
    console.log("✅ New BTC price:", ethers.utils.formatUnits(updatedPrice, 6), "USDC");
    
    // Test the LTV calculation with new price
    console.log("\n🧮 Testing LTV calculation with new price:");
    const collateralAmount = ethers.utils.parseUnits("0.05", 8); // 0.05 BTC
    const collateralValueUSD = collateralAmount.mul(updatedPrice).div(ethers.utils.parseUnits("1", 8));
    const maxBorrow = collateralValueUSD.mul(5000).div(10000); // 50% LTV
    
    console.log("Collateral (0.05 BTC) Value USD:", ethers.utils.formatUnits(collateralValueUSD, 6));
    console.log("Max Borrow (50% LTV):", ethers.utils.formatUnits(maxBorrow, 6), "USDC");
    
    console.log("\n🎉 New oracle price update complete!");
    console.log(`📋 Oracle Address: ${btcOracleAddress}`);
    console.log("✅ Fresh oracle ready for lending pool integration!");
    
  } catch (error) {
    console.error("❌ Error updating new BTC oracle price:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });