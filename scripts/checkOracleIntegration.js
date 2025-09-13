const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking oracle integration in LendingPool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);

  // Contract addresses
  const LENDING_POOL_ADDRESS = "0xC27B1396d2e478bC113abe1794A6eC701B0b28D2";
  const BTC_CONSUMER_ADDRESS = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e";

  // Get LendingPool contract
  const lendingPool = await ethers.getContractAt("LendingPool", LENDING_POOL_ADDRESS);
  
  // Try to read the oracle address from lending pool
  try {
    console.log("📊 Checking oracle configuration:");
    
    // Check if lending pool has an oracle address
    let oracleAddress;
    try {
      oracleAddress = await lendingPool.priceOracle();
      console.log("LendingPool oracle address:", oracleAddress);
    } catch (error) {
      console.log("Could not read priceOracle from LendingPool, trying other methods...");
      
      try {
        oracleAddress = await lendingPool.oracle();
        console.log("LendingPool oracle address (oracle):", oracleAddress);
      } catch (error2) {
        console.log("Could not read oracle address, might be hardcoded");
      }
    }

    // Check the BTC consumer we know about
    const btcConsumer = await ethers.getContractAt([
      "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)",
      "function owner() external view returns (address)"
    ], BTC_CONSUMER_ADDRESS);
    
    const [btcPrice, timestamp, isStale] = await btcConsumer.viewLatestPrice();
    const btcPriceUSD = Number(btcPrice) / 1e18;
    
    console.log("\nBTC Consumer we know about:", BTC_CONSUMER_ADDRESS);
    console.log("Price:", btcPriceUSD.toLocaleString(), "USD");
    console.log("Timestamp:", new Date(timestamp * 1000).toLocaleString());
    console.log("Is Stale:", isStale);
    
    try {
      const owner = await btcConsumer.owner();
      console.log("Owner:", owner);
    } catch (error) {
      console.log("Could not read owner");
    }

    // If we found an oracle address from lending pool, check it
    if (oracleAddress && oracleAddress !== ethers.constants.AddressZero) {
      console.log("\n📊 Checking oracle used by LendingPool:");
      try {
        const lendingPoolOracle = await ethers.getContractAt([
          "function viewLatestPrice() external view returns (int256 price, uint256 timestamp, bool isStale)"
        ], oracleAddress);
        
        const [lendingBtcPrice, lendingTimestamp, lendingIsStale] = await lendingPoolOracle.viewLatestPrice();
        const lendingBtcPriceUSD = Number(lendingBtcPrice) / 1e18;
        
        console.log("LendingPool Oracle address:", oracleAddress);
        console.log("Price:", lendingBtcPriceUSD.toLocaleString(), "USD");
        console.log("Timestamp:", new Date(lendingTimestamp * 1000).toLocaleString());
        console.log("Is Stale:", lendingIsStale);
        
        if (oracleAddress.toLowerCase() === BTC_CONSUMER_ADDRESS.toLowerCase()) {
          console.log("✅ Same oracle - price staleness is the issue");
        } else {
          console.log("❌ Different oracle - need to update the correct one");
        }
      } catch (error) {
        console.log("Could not read from lending pool oracle:", error.message);
      }
    }

    // Try to get more info about lending pool configuration
    console.log("\n🔍 Additional LendingPool info:");
    try {
      const maxLTV = await lendingPool.MAX_LTV_RATIO();
      console.log("Max LTV:", maxLTV.toString());
    } catch (error) {
      console.log("Could not read MAX_LTV_RATIO");
    }

  } catch (error) {
    console.error("❌ Error checking oracle integration:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });