const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying fresh BTC oracle for lending...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  try {
    // Get current BTC price
    console.log("📡 Fetching current BTC price...");
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
    const averagePrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
    console.log(`📊 Average BTC Price: $${averagePrice.toLocaleString()}`);

    // Deploy new BTCOracle with fresh price
    console.log("\n🚀 Deploying fresh BTCOracle...");
    
    const BTCOracle = await ethers.getContractFactory("BTCOracle");
    
    console.log("Deploying BTCOracle contract...");
    
    const btcOracle = await BTCOracle.deploy();
    await btcOracle.deployed();
    
    console.log("✅ New BTCOracle deployed at:", btcOracle.address);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/address/${btcOracle.address}`);

    // Update with fresh price
    console.log("\n🔄 Updating with fresh price...");
    const priceWithDecimals = ethers.utils.parseUnits(averagePrice.toFixed(6), 6); // 6 decimals for USDC
    const updateTx = await btcOracle.updatePrice(priceWithDecimals);
    await updateTx.wait();
    
    console.log("✅ Price updated successfully");
    console.log("🔗 Update Tx:", `https://scan.test2.btcs.network/tx/${updateTx.hash}`);

    // Verify the price is fresh
    const [deployedPrice, timestamp] = await btcOracle.getPriceWithTimestamp();
    const deployedPriceUSD = Number(deployedPrice) / 1e6;
    
    console.log("\n📊 New Oracle State:");
    console.log("Price:", deployedPriceUSD.toLocaleString(), "USD");
    console.log("Timestamp:", new Date(timestamp * 1000).toLocaleString());
    console.log("Fresh Price:", "✅ Just deployed with current price");

    // For now, let's deploy a new lending pool with the fresh oracle
    console.log("\n🚀 Deploying new LendingPool with fresh oracle...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    
    // Get existing contract addresses for the new lending pool
    const USDC_ADDRESS = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
    const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
    
    console.log("Deploying LendingPool with:");
    console.log("USDC:", USDC_ADDRESS);
    console.log("bBTC:", BBTC_ADDRESS);
    console.log("BTC Oracle:", btcOracle.address);
    
    const newLendingPool = await LendingPool.deploy(
      USDC_ADDRESS,
      BBTC_ADDRESS, 
      btcOracle.address
    );
    await newLendingPool.deployed();
    
    console.log("✅ New LendingPool deployed at:", newLendingPool.address);
    console.log("🔗 Explorer:", `https://scan.test2.btcs.network/address/${newLendingPool.address}`);
    
    // Add some liquidity to the new pool
    console.log("\n💧 Adding USDC liquidity to new pool...");
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const liquidityAmount = ethers.utils.parseUnits("100000", 6); // 100k USDC
    
    try {
      const transferTx = await usdc.transfer(newLendingPool.address, liquidityAmount);
      await transferTx.wait();
      console.log("✅ Added 100,000 USDC liquidity");
      console.log("🔗 Tx:", `https://scan.test2.btcs.network/tx/${transferTx.hash}`);
    } catch (error) {
      console.log("⚠️ Could not add liquidity, might need manual addition");
    }

    console.log("\n🎉 Complete fresh system deployed!");
    console.log(`📋 New Oracle Address: ${btcOracle.address}`);
    console.log(`📋 New LendingPool Address: ${newLendingPool.address}`);
    console.log(`📋 Current BTC Price: $${averagePrice.toLocaleString()}`);
    
    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend to use new LendingPool address");
    console.log("2. Test complete borrowing flow");
    console.log("3. Update contract addresses in environment");

  } catch (error) {
    console.error("❌ Failed to deploy fresh oracle:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });