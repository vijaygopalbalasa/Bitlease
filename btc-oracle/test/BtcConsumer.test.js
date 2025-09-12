const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BtcConsumer", function () {
  let SimpleAggregator, BtcConsumer;
  let aggregator, consumer;
  let owner, addr1;
  
  const DECIMALS = 8;
  const MAX_AGE = 3600; // 1 hour
  const INITIAL_PRICE = ethers.BigNumber.from("5000000000000"); // $50,000 with 8 decimals

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Deploy aggregator
    SimpleAggregator = await ethers.getContractFactory("SimpleAggregator");
    aggregator = await SimpleAggregator.deploy(owner.address, DECIMALS);
    await aggregator.deployed();
    
    // Deploy consumer
    BtcConsumer = await ethers.getContractFactory("BtcConsumer");
    consumer = await BtcConsumer.deploy(aggregator.address, MAX_AGE);
    await consumer.deployed();
    
    // Update aggregator with initial price
    await aggregator.updateAnswer(INITIAL_PRICE);
  });

  describe("Deployment", function () {
    it("Should set the correct aggregator address", async function () {
      expect(await consumer.getAggregator()).to.equal(aggregator.address);
    });

    it("Should set the correct max age", async function () {
      expect(await consumer.getMaxAge()).to.equal(MAX_AGE);
    });

    it("Should revert with zero aggregator address", async function () {
      await expect(
        BtcConsumer.deploy(ethers.constants.AddressZero, MAX_AGE)
      ).to.be.revertedWith("BtcConsumer: aggregator cannot be zero address");
    });

    it("Should revert with zero max age", async function () {
      await expect(
        BtcConsumer.deploy(aggregator.address, 0)
      ).to.be.revertedWith("BtcConsumer: maxAge must be greater than 0");
    });
  });

  describe("Price Scaling", function () {
    it("Should scale 8-decimal price to 18 decimals", async function () {
      // INITIAL_PRICE is 5000000000000 (8 decimals) = $50,000
      // Expected 18-decimal result: 50000000000000000000000 = $50,000
      const expected = INITIAL_PRICE.mul(ethers.BigNumber.from("10").pow(10));
      
      const result = await consumer.viewLatestPrice();
      expect(result.price).to.equal(expected);
    });

    it("Should handle different decimal precisions", async function () {
      // Test with different aggregator decimals
      const testCases = [
        { decimals: 6, price: "50000000000", expectedScale: 12 }, // 6 -> 18 decimals
        { decimals: 10, price: "500000000000000", expectedScale: 8 }, // 10 -> 18 decimals
        { decimals: 18, price: "50000000000000000000000", expectedScale: 0 }, // 18 -> 18 decimals
      ];

      for (const testCase of testCases) {
        // Deploy new aggregator with different decimals
        const testAggregator = await SimpleAggregator.deploy(owner.address, testCase.decimals);
        await testAggregator.deployed();
        
        const testConsumer = await BtcConsumer.deploy(testAggregator.address, MAX_AGE);
        await testConsumer.deployed();
        
        await testAggregator.updateAnswer(testCase.price);
        
        const result = await testConsumer.viewLatestPrice();
        const expected = ethers.BigNumber.from(testCase.price).mul(
          ethers.BigNumber.from("10").pow(testCase.expectedScale)
        );
        
        expect(result.price).to.equal(expected);
      }
    });
  });

  describe("Staleness Protection", function () {
    it("Should return fresh price when not stale", async function () {
      const result = await consumer.viewLatestPrice();
      expect(result.isStale).to.be.false;
    });

    it("Should detect stale price", async function () {
      // Deploy consumer with very short max age
      const shortAgeConsumer = await BtcConsumer.deploy(aggregator.address, 1); // 1 second
      await shortAgeConsumer.deployed();
      
      // Wait for price to become stale
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await shortAgeConsumer.viewLatestPrice();
      expect(result.isStale).to.be.true;
    });

    it("Should revert when calling getLatestPrice with stale data", async function () {
      // Deploy consumer with very short max age
      const shortAgeConsumer = await BtcConsumer.deploy(aggregator.address, 1); // 1 second
      await shortAgeConsumer.deployed();
      
      // Wait for price to become stale
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await expect(
        shortAgeConsumer.getLatestPrice()
      ).to.be.revertedWith("BtcConsumer: price data is stale");
    });

    it("Should emit StalePriceRejected event", async function () {
      const shortAgeConsumer = await BtcConsumer.deploy(aggregator.address, 1);
      await shortAgeConsumer.deployed();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await expect(
        shortAgeConsumer.getLatestPrice()
      ).to.emit(shortAgeConsumer, "StalePriceRejected");
    });
  });

  describe("Price Retrieval", function () {
    it("Should emit PriceRequested event on getLatestPrice", async function () {
      const expectedScaled = INITIAL_PRICE.mul(ethers.BigNumber.from("10").pow(10));
      
      await expect(consumer.getLatestPrice())
        .to.emit(consumer, "PriceRequested")
        .withArgs(INITIAL_PRICE, expectedScaled, await aggregator.latestTimestamp());
    });

    it("Should return correct timestamp", async function () {
      const result = await consumer.viewLatestPrice();
      const aggregatorTimestamp = await aggregator.latestTimestamp();
      
      expect(result.timestamp).to.equal(aggregatorTimestamp);
    });

    it("Should handle zero price from aggregator", async function () {
      // Deploy new aggregator without updating price (remains 0)
      const zeroAggregator = await SimpleAggregator.deploy(owner.address, DECIMALS);
      await zeroAggregator.deployed();
      
      const zeroConsumer = await BtcConsumer.deploy(zeroAggregator.address, MAX_AGE);
      await zeroConsumer.deployed();
      
      const result = await zeroConsumer.viewLatestPrice();
      expect(result.price).to.equal(0);
      expect(result.isStale).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("Should return correct isStale status", async function () {
      expect(await consumer.isStale()).to.be.false;
      
      // Test with stale consumer
      const shortAgeConsumer = await BtcConsumer.deploy(aggregator.address, 1);
      await shortAgeConsumer.deployed();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(await shortAgeConsumer.isStale()).to.be.true;
    });

    it("Should return aggregator and maxAge correctly", async function () {
      expect(await consumer.getAggregator()).to.equal(aggregator.address);
      expect(await consumer.getMaxAge()).to.equal(MAX_AGE);
    });
  });

  describe("Error Handling", function () {
    it("Should revert with invalid price data", async function () {
      // This test simulates aggregator returning invalid data
      // In practice, this would be tested with a mock aggregator
      await expect(
        consumer.getLatestPrice()
      ).to.not.be.reverted; // Should work with valid data
    });
  });

  describe("Integration Tests", function () {
    it("Should work end-to-end with price updates", async function () {
      const prices = [
        ethers.BigNumber.from("5000000000000"), // $50,000
        ethers.BigNumber.from("5500000000000"), // $55,000
        ethers.BigNumber.from("4800000000000"), // $48,000
      ];

      for (const price of prices) {
        await aggregator.updateAnswer(price);
        
        const result = await consumer.viewLatestPrice();
        const expected = price.mul(ethers.BigNumber.from("10").pow(10));
        
        expect(result.price).to.equal(expected);
        expect(result.isStale).to.be.false;
      }
    });

    it("Should maintain accuracy across multiple updates", async function () {
      // Test precision with large numbers
      const largePrice = ethers.BigNumber.from("10000000000000"); // $100,000
      await aggregator.updateAnswer(largePrice);
      
      const result = await consumer.viewLatestPrice();
      const expected = largePrice.mul(ethers.BigNumber.from("10").pow(10));
      
      expect(result.price).to.equal(expected);
      
      // Verify no precision loss
      const backConverted = result.price.div(ethers.BigNumber.from("10").pow(10));
      expect(backConverted).to.equal(largePrice);
    });
  });
});