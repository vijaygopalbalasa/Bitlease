const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging oracle staleness issue...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Debugging with account:", deployer.address);

  const BTC_CONSUMER_ADDRESS = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e";

  // Get BTC Consumer with more detailed ABI
  const btcConsumer = await ethers.getContractAt([
    "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)",
    "function updatePrice() external",
    "function STALE_THRESHOLD() external view returns (uint256)",
    "function lastPriceUpdate() external view returns (uint256)"
  ], BTC_CONSUMER_ADDRESS);

  console.log("📊 Current oracle state:");
  const [btcPrice, timestamp, isStale] = await btcConsumer.viewLatestPrice();
  const btcPriceUSD = Number(btcPrice) / 1e18;
  
  console.log("Price:", btcPriceUSD.toLocaleString(), "USD");
  console.log("Timestamp:", timestamp.toString(), "(" + new Date(timestamp * 1000).toLocaleString() + ")");
  console.log("Is Stale:", isStale);
  console.log("Current time:", Math.floor(Date.now() / 1000), "(" + new Date().toLocaleString() + ")");
  console.log("Time difference:", Math.floor(Date.now() / 1000) - Number(timestamp), "seconds");

  try {
    const staleThreshold = await btcConsumer.STALE_THRESHOLD();
    console.log("Stale threshold:", staleThreshold.toString(), "seconds");
    
    if (Math.floor(Date.now() / 1000) - Number(timestamp) > Number(staleThreshold)) {
      console.log("❌ Price is stale because it exceeds threshold");
    } else {
      console.log("✅ Price should not be stale based on threshold");
    }
  } catch (error) {
    console.log("Could not read stale threshold:", error.message);
  }

  try {
    const lastUpdate = await btcConsumer.lastPriceUpdate();
    console.log("Last price update timestamp:", lastUpdate.toString(), "(" + new Date(lastUpdate * 1000).toLocaleString() + ")");
  } catch (error) {
    console.log("Could not read last price update:", error.message);
  }

  // Try to force update the price
  console.log("\n🔄 Attempting to force update price...");
  try {
    // First let's try without gas limit
    const updateTx = await btcConsumer.updatePrice();
    console.log("✅ Price update transaction sent:", updateTx.hash);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${updateTx.hash}`);
    
    await updateTx.wait();
    console.log("✅ Price update confirmed");
    
    // Check state after update
    const [newPrice, newTimestamp, newIsStale] = await btcConsumer.viewLatestPrice();
    const newBtcPriceUSD = Number(newPrice) / 1e18;
    
    console.log("\n📊 After update:");
    console.log("Price:", newBtcPriceUSD.toLocaleString(), "USD");
    console.log("Timestamp:", newTimestamp.toString(), "(" + new Date(newTimestamp * 1000).toLocaleString() + ")");
    console.log("Is Stale:", newIsStale);
    
    if (newIsStale) {
      console.log("❌ Still stale after update - there might be an oracle implementation issue");
    } else {
      console.log("✅ Price is now fresh - ready for borrowing!");
    }
    
  } catch (error) {
    console.error("❌ Failed to update price:");
    console.error("Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 This might be a permission issue or oracle implementation problem");
      console.log("The oracle might only allow specific addresses to update prices");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });