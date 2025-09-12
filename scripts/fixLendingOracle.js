const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing BTC oracle for lending pool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Fixing with account:", deployer.address);

  // The oracle that lending pool actually uses
  const LENDING_ORACLE_ADDRESS = "0x3dCDb917943CCFfC6b5b170a660923f925FA6A3e";

  try {
    console.log("📡 Fetching current BTC price from APIs...");
    
    // Fetch from multiple sources
    const sources = [
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        parser: (data) => parseFloat(data.price)
      },
      {
        name: 'CryptoCompare', 
        url: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
        parser: (data) => data.USD
      }
    ];

    const prices = {};
    for (const source of sources) {
      try {
        const response = await fetch(source.url);
        const data = await response.json();
        const price = source.parser(data);
        
        if (price && price > 50000 && price < 200000) {
          prices[source.name] = price;
          console.log(`✅ ${source.name}: $${price.toLocaleString()}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to fetch from ${source.name}:`, error.message);
      }
    }

    const priceValues = Object.values(prices);
    if (priceValues.length === 0) {
      throw new Error('Failed to fetch BTC price from any source');
    }

    const averagePrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    console.log(`📊 Average BTC Price: $${averagePrice.toLocaleString()}`);

    // Check if we can update the oracle directly
    console.log("\n🔍 Checking oracle update methods...");
    
    // Try different possible update methods
    const updateMethods = [
      "updatePrice",
      "setPrice", 
      "updateBTCPrice",
      "setPriceData"
    ];
    
    let updateSuccessful = false;
    
    for (const method of updateMethods) {
      try {
        console.log(`\n🔄 Trying ${method}...`);
        
        let oracle, tx;
        
        if (method === "updatePrice") {
          // Simple price update
          oracle = await ethers.getContractAt([
            `function ${method}(uint256) external`,
            "function viewLatestPrice() external view returns (int256, uint256, bool)"
          ], LENDING_ORACLE_ADDRESS);
          
          const priceWei = ethers.utils.parseUnits(averagePrice.toFixed(6), 6);
          tx = await oracle[method](priceWei);
          
        } else if (method === "setPrice") {
          oracle = await ethers.getContractAt([
            `function ${method}(int256) external`,
            "function viewLatestPrice() external view returns (int256, uint256, bool)"
          ], LENDING_ORACLE_ADDRESS);
          
          const priceWei = ethers.utils.parseUnits(averagePrice.toFixed(18), 18);
          tx = await oracle[method](priceWei);
          
        } else if (method === "updateBTCPrice") {
          oracle = await ethers.getContractAt([
            `function ${method}() external`,
            "function viewLatestPrice() external view returns (int256, uint256, bool)"
          ], LENDING_ORACLE_ADDRESS);
          
          tx = await oracle[method]();
          
        } else if (method === "setPriceData") {
          oracle = await ethers.getContractAt([
            `function ${method}(int256, uint256) external`,
            "function viewLatestPrice() external view returns (int256, uint256, bool)"
          ], LENDING_ORACLE_ADDRESS);
          
          const priceWei = ethers.utils.parseUnits(averagePrice.toFixed(18), 18);
          const timestamp = Math.floor(Date.now() / 1000);
          tx = await oracle[method](priceWei, timestamp);
        }
        
        console.log(`✅ Transaction sent: ${tx.hash}`);
        console.log(`🔗 Explorer: https://scan.test2.btcs.network/tx/${tx.hash}`);
        
        await tx.wait();
        console.log(`✅ ${method} successful!`);
        
        // Verify the update
        const [newPrice, newTimestamp, newIsStale] = await oracle.viewLatestPrice();
        const newPriceUSD = Number(newPrice) / 1e18;
        
        console.log(`\n📊 Updated Oracle State:`);
        console.log(`Price: $${newPriceUSD.toLocaleString()}`);
        console.log(`Timestamp: ${new Date(newTimestamp * 1000).toLocaleString()}`);
        console.log(`Is Stale: ${newIsStale}`);
        
        updateSuccessful = true;
        break;
        
      } catch (error) {
        console.log(`❌ ${method} failed: ${error.message.substring(0, 100)}...`);
      }
    }
    
    if (!updateSuccessful) {
      console.log("\n🔧 All update methods failed, trying manual price injection...");
      
      // Deploy a new oracle with current price if needed
      console.log("This might require deploying a new oracle or manual intervention");
      throw new Error("Could not update oracle through any method");
    }
    
    console.log("\n🎉 Oracle update complete!");
    console.log("✅ Users can now borrow with fresh BTC price");

  } catch (error) {
    console.error("\n❌ Failed to fix lending oracle:");
    console.error(error.message);
    
    console.log("\n🔧 Alternative Solution:");
    console.log("1. Deploy a new oracle contract with current price");
    console.log("2. Update lending pool to use the new oracle");
    console.log("3. Or manually call updatePrice with higher gas limit");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });