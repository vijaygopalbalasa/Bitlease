const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying BTC Oracle System to Core Testnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "tCORE");

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.warn("⚠️  Low balance. Get tCORE from: https://scan.test2.btcs.network/faucet");
  }

  // Configuration
  const config = {
    owner: deployer.address,
    decimals: 8, // BTC/USD typically uses 8 decimals
    maxAge: 3600, // 1 hour staleness threshold
  };

  console.log("\n📋 Configuration:");
  console.log("Owner:", config.owner);
  console.log("Decimals:", config.decimals);
  console.log("Max Age:", config.maxAge, "seconds");

  // 1. Deploy SimpleAggregator
  console.log("\n1️⃣ Deploying SimpleAggregator...");
  const SimpleAggregator = await ethers.getContractFactory("SimpleAggregator");
  const aggregator = await SimpleAggregator.deploy(config.owner, config.decimals);
  await aggregator.deployed();
  
  console.log("✅ SimpleAggregator deployed:", aggregator.address);

  // 2. Deploy BtcConsumer
  console.log("\n2️⃣ Deploying BtcConsumer...");
  const BtcConsumer = await ethers.getContractFactory("BtcConsumer");
  const consumer = await BtcConsumer.deploy(aggregator.address, config.maxAge);
  await consumer.deployed();
  
  console.log("✅ BtcConsumer deployed:", consumer.address);

  // 3. Initialize with current BTC price
  console.log("\n3️⃣ Initializing with current BTC price...");
  try {
    // Fetch current BTC price from CoinGecko
    const axios = require('axios');
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const currentPrice = response.data.bitcoin.usd;
    
    // Scale price to 8 decimals (e.g., $50,000 -> 5000000000000)
    const scaledPrice = Math.round(currentPrice * 1e8);
    
    console.log(`Current BTC Price: $${currentPrice}`);
    console.log(`Scaled Price: ${scaledPrice}`);
    
    // Update the aggregator with current price
    const updateTx = await aggregator.updateAnswer(scaledPrice);
    await updateTx.wait();
    
    console.log("✅ Initial price updated successfully");
  } catch (error) {
    console.warn("⚠️  Could not fetch initial price:", error.message);
    console.log("You can update the price manually using the updater script");
  }

  // 4. Verify deployment
  console.log("\n4️⃣ Verifying deployment...");
  try {
    const latestData = await aggregator.latestRoundData();
    const consumerPrice = await consumer.viewLatestPrice();
    
    console.log("Aggregator latest answer:", latestData.answer.toString());
    console.log("Consumer scaled price:", consumerPrice.price.toString());
    console.log("Is stale:", consumerPrice.isStale);
  } catch (error) {
    console.warn("⚠️  Verification warning:", error.message);
  }

  // 5. Save deployment info
  const deploymentInfo = {
    network: "core-testnet",
    chainId: 1114,
    deployer: deployer.address,
    contracts: {
      SimpleAggregator: aggregator.address,
      BtcConsumer: consumer.address,
    },
    config: {
      decimals: config.decimals,
      maxAge: config.maxAge,
    },
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // 6. Generate .env file
  const envPath = path.join(__dirname, "../.env");
  const envContent = `# BTC Oracle Environment Configuration
PRIVATE_KEY=${process.env.PRIVATE_KEY || ""}
RPC_URL=https://rpc.test2.btcs.network
AGGREGATOR_ADDRESS=${aggregator.address}
CONSUMER_ADDRESS=${consumer.address}
DECIMALS=${config.decimals}
MAX_AGE=${config.maxAge}
UPDATE_INTERVAL=300
COINGECKO_API_URL=https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
`;

  fs.writeFileSync(envPath, envContent);

  // 7. Display summary
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("📋 CONTRACT ADDRESSES:");
  console.log("SimpleAggregator:", aggregator.address);
  console.log("BtcConsumer:", consumer.address);
  console.log("");
  console.log("🔧 NEXT STEPS:");
  console.log("1. Run tests: npm test");
  console.log("2. Start price updater: npm run update-price");
  console.log("3. Deploy frontend widget");
  console.log("");
  console.log("🔗 TESTNET LINKS:");
  console.log("Explorer:", `https://scan.test2.btcs.network/address/${aggregator.address}`);
  console.log("Faucet:", "https://scan.test2.btcs.network/faucet");
  console.log("");
  console.log("📁 FILES CREATED:");
  console.log("- deployment.json (contract addresses and config)");
  console.log("- .env (environment variables)");
  console.log("");
  console.log("⚠️  PRODUCTION NOTE:");
  console.log("Replace owner with Gnosis Safe for production deployment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });