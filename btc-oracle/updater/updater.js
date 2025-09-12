#!/usr/bin/env node

const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

/**
 * Professional BTC Price Updater
 * Fetches BTC/USD price from CoinGecko and updates the SimpleAggregator contract
 */
class BTCPriceUpdater {
  constructor() {
    this.validateConfig();
    this.initializeProvider();
    this.initializeContract();
  }

  /**
   * Validate required environment variables
   */
  validateConfig() {
    const required = ["PRIVATE_KEY", "RPC_URL", "AGGREGATOR_ADDRESS"];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:", missing.join(", "));
      console.error("Please check your .env file");
      process.exit(1);
    }

    this.config = {
      privateKey: process.env.PRIVATE_KEY,
      rpcUrl: process.env.RPC_URL,
      aggregatorAddress: process.env.AGGREGATOR_ADDRESS,
      decimals: parseInt(process.env.DECIMALS) || 8,
      updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 300, // 5 minutes
      coingeckoUrl: process.env.COINGECKO_API_URL || 
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    };

    console.log("📋 Configuration loaded:");
    console.log(`- RPC URL: ${this.config.rpcUrl}`);
    console.log(`- Aggregator: ${this.config.aggregatorAddress}`);
    console.log(`- Decimals: ${this.config.decimals}`);
    console.log(`- Update interval: ${this.config.updateInterval}s`);
  }

  /**
   * Initialize ethers provider and wallet
   */
  initializeProvider() {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
      
      console.log("🔗 Connected to Core testnet");
      console.log(`📍 Wallet address: ${this.wallet.address}`);
    } catch (error) {
      console.error("❌ Failed to initialize provider:", error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize contract instance
   */
  initializeContract() {
    const aggregatorABI = [
      "function updateAnswer(int256 answer) external",
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
      "function owner() external view returns (address)",
      "function getDecimals() external view returns (uint8)"
    ];

    this.aggregator = new ethers.Contract(
      this.config.aggregatorAddress,
      aggregatorABI,
      this.wallet
    );

    console.log("📜 Contract initialized");
  }

  /**
   * Fetch BTC price from CoinGecko
   */
  async fetchBTCPrice() {
    try {
      console.log("📡 Fetching BTC price from CoinGecko...");
      
      const response = await axios.get(this.config.coingeckoUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'BTC-Oracle-Updater/1.0'
        }
      });

      if (!response.data || !response.data.bitcoin || !response.data.bitcoin.usd) {
        throw new Error("Invalid response format from CoinGecko");
      }

      const price = response.data.bitcoin.usd;
      
      // Validate price is reasonable
      if (price < 1000 || price > 1000000) {
        throw new Error(`Price ${price} is outside reasonable range`);
      }

      console.log(`💰 Current BTC Price: $${price.toLocaleString()}`);
      return price;

    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error("Request timeout - CoinGecko API unavailable");
      }
      throw new Error(`Failed to fetch price: ${error.message}`);
    }
  }

  /**
   * Scale price to contract decimals
   */
  scalePriceToDecimals(price) {
    // Convert price to fixed-point integer with specified decimals
    const scaleFactor = Math.pow(10, this.config.decimals);
    const scaledPrice = Math.round(price * scaleFactor);
    
    console.log(`🔢 Scaled price: ${scaledPrice} (${this.config.decimals} decimals)`);
    return scaledPrice;
  }

  /**
   * Check if update is needed
   */
  async shouldUpdate(newPrice) {
    try {
      const currentData = await this.aggregator.latestRoundData();
      const currentAnswer = currentData.answer;
      const lastUpdated = currentData.updatedAt;
      
      // Convert current answer back to USD for comparison
      const currentPriceUSD = currentAnswer.div(
        ethers.BigNumber.from(10).pow(this.config.decimals)
      ).toNumber();
      
      const now = Math.floor(Date.now() / 1000);
      const ageSeconds = now - lastUpdated.toNumber();
      
      console.log(`📊 Current contract price: $${currentPriceUSD.toLocaleString()}`);
      console.log(`⏰ Last updated: ${ageSeconds}s ago`);
      
      // Calculate price difference percentage
      const priceDiff = Math.abs(newPrice - currentPriceUSD) / currentPriceUSD * 100;
      console.log(`📈 Price difference: ${priceDiff.toFixed(2)}%`);
      
      // Update if price difference > 0.5% or age > 1 hour
      const shouldUpdatePrice = priceDiff > 0.5;
      const shouldUpdateAge = ageSeconds > 3600; // 1 hour
      
      const shouldUpdate = shouldUpdatePrice || shouldUpdateAge;
      
      if (shouldUpdate) {
        const reason = shouldUpdatePrice ? `price change (${priceDiff.toFixed(2)}%)` : `age (${ageSeconds}s)`;
        console.log(`✅ Update needed due to ${reason}`);
      } else {
        console.log(`⏭️  No update needed`);
      }
      
      return shouldUpdate;

    } catch (error) {
      console.warn("⚠️  Could not check current price, proceeding with update:", error.message);
      return true;
    }
  }

  /**
   * Update price on contract
   */
  async updatePrice(scaledPrice) {
    try {
      console.log("📝 Updating contract price...");
      
      // Check wallet balance
      const balance = await this.wallet.getBalance();
      const balanceEth = ethers.utils.formatEther(balance);
      console.log(`💰 Wallet balance: ${balanceEth} tCORE`);
      
      if (balance.lt(ethers.utils.parseEther("0.01"))) {
        throw new Error("Insufficient balance for transaction. Get tCORE from faucet.");
      }

      // Estimate gas
      const gasEstimate = await this.aggregator.estimateGas.updateAnswer(scaledPrice);
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      // Send transaction
      const tx = await this.aggregator.updateAnswer(scaledPrice, {
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      });
      
      console.log(`🚀 Transaction sent: ${tx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Price update confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        return true;
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error) {
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error("Insufficient funds for transaction");
      } else if (error.code === 'CALL_EXCEPTION') {
        throw new Error("Contract call failed - check owner permissions");
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error("Network error - check RPC connection");
      }
      throw error;
    }
  }

  /**
   * Perform single price update
   */
  async performUpdate() {
    try {
      console.log("\n🔄 Starting price update cycle...");
      
      // Fetch current price
      const currentPrice = await this.fetchBTCPrice();
      
      // Check if update is needed
      if (!(await this.shouldUpdate(currentPrice))) {
        return false;
      }
      
      // Scale price
      const scaledPrice = this.scalePriceToDecimals(currentPrice);
      
      // Update contract
      await this.updatePrice(scaledPrice);
      
      console.log("🎉 Update cycle completed successfully\n");
      return true;
      
    } catch (error) {
      console.error("❌ Update cycle failed:", error.message);
      
      // Log additional context for common errors
      if (error.message.includes("owner")) {
        console.error("💡 Tip: Make sure you're using the owner's private key");
      } else if (error.message.includes("funds")) {
        console.error("💡 Tip: Get tCORE from https://scan.test2.btcs.network/faucet");
      } else if (error.message.includes("network")) {
        console.error("💡 Tip: Check your RPC_URL and internet connection");
      }
      
      return false;
    }
  }

  /**
   * Start continuous price monitoring
   */
  async startMonitoring() {
    console.log(`🏃 Starting continuous monitoring (${this.config.updateInterval}s intervals)`);
    console.log("Press Ctrl+C to stop\n");
    
    // Initial update
    await this.performUpdate();
    
    // Set up interval
    const interval = setInterval(async () => {
      await this.performUpdate();
    }, this.config.updateInterval * 1000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log("\n🛑 Shutting down updater...");
      clearInterval(interval);
      process.exit(0);
    });
  }

  /**
   * Display contract info
   */
  async displayInfo() {
    try {
      console.log("\n📊 ORACLE STATUS");
      console.log("=" .repeat(50));
      
      const [owner, decimals, roundData] = await Promise.all([
        this.aggregator.owner(),
        this.aggregator.getDecimals(),
        this.aggregator.latestRoundData()
      ]);
      
      const priceUSD = roundData.answer.div(
        ethers.BigNumber.from(10).pow(decimals)
      ).toNumber();
      
      const lastUpdated = new Date(roundData.updatedAt.toNumber() * 1000);
      const ageMinutes = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
      
      console.log(`Contract: ${this.config.aggregatorAddress}`);
      console.log(`Owner: ${owner}`);
      console.log(`Decimals: ${decimals}`);
      console.log(`Current Price: $${priceUSD.toLocaleString()}`);
      console.log(`Round: ${roundData.roundId.toString()}`);
      console.log(`Last Updated: ${lastUpdated.toLocaleString()} (${ageMinutes} min ago)`);
      console.log(`Your Address: ${this.wallet.address}`);
      console.log(`Is Owner: ${owner.toLowerCase() === this.wallet.address.toLowerCase()}`);
      
    } catch (error) {
      console.error("❌ Failed to fetch contract info:", error.message);
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const updater = new BTCPriceUpdater();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 BTC Price Updater

Usage:
  node updater.js [options]

Options:
  --help, -h     Show this help message
  --info, -i     Display oracle contract information  
  --once         Run update once and exit
  --watch        Start continuous monitoring (default)

Environment Variables:
  PRIVATE_KEY           Private key of oracle owner
  RPC_URL              Core testnet RPC URL  
  AGGREGATOR_ADDRESS   SimpleAggregator contract address
  DECIMALS             Price decimals (default: 8)
  UPDATE_INTERVAL      Update interval in seconds (default: 300)

Examples:
  node updater.js --once      # Single update
  node updater.js --watch     # Continuous monitoring
  node updater.js --info      # Show contract status
`);
    return;
  }
  
  if (args.includes('--info') || args.includes('-i')) {
    await updater.displayInfo();
    return;
  }
  
  if (args.includes('--once')) {
    const success = await updater.performUpdate();
    process.exit(success ? 0 : 1);
  } else {
    // Default: start monitoring
    await updater.startMonitoring();
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BTCPriceUpdater;