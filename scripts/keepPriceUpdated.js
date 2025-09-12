const { ethers } = require("hardhat");

// Script to keep the BTC price updated automatically
// This can be run periodically or triggered by frontend
async function updatePriceFromAPI() {
  console.log("🔄 Fetching latest BTC price and updating contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Updating with account:", deployer.address);

  // Contract addresses
  const btcOracleAddress = "0x321440a843027E339A9aEA0d307583fA47bdBf80";

  try {
    // Fetch BTC price from multiple sources
    const sources = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        parser: (data) => data.bitcoin.usd
      },
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        parser: (data) => parseFloat(data.price)
      }
    ];

    console.log("📡 Fetching BTC price from multiple sources...");
    const prices = {};

    for (const source of sources) {
      try {
        const response = await fetch(source.url);
        const data = await response.json();
        const price = source.parser(data);
        
        if (price && price > 10000 && price < 200000) { // Sanity check
          prices[source.name] = price;
          console.log(`✅ ${source.name}: $${price.toFixed(2)}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to fetch from ${source.name}:`, error.message);
      }
    }

    // Calculate average price
    const priceValues = Object.values(prices);
    if (priceValues.length === 0) {
      throw new Error('Failed to fetch BTC price from any source');
    }

    const averagePrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    console.log(`📊 Average BTC Price: $${averagePrice.toFixed(2)}`);

    // Update contract
    const BTCOracle = await ethers.getContractFactory("BTCOracle");
    const btcOracle = BTCOracle.attach(btcOracleAddress);

    const newPrice = ethers.utils.parseUnits(averagePrice.toFixed(2), 6);
    console.log(`🔄 Updating contract to: $${averagePrice.toFixed(2)}`);

    const tx = await btcOracle.updatePrice(newPrice);
    await tx.wait();

    console.log("✅ Contract BTC price updated successfully!");
    console.log("📝 Transaction hash:", tx.hash);

    return averagePrice;

  } catch (error) {
    console.error("❌ Error updating BTC price:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updatePriceFromAPI()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updatePriceFromAPI };