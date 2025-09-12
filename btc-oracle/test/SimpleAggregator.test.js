const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleAggregator", function () {
  let SimpleAggregator, aggregator;
  let owner, addr1, addr2;
  
  const DECIMALS = 8;
  const INITIAL_PRICE = ethers.BigNumber.from("5000000000000"); // $50,000 with 8 decimals

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    SimpleAggregator = await ethers.getContractFactory("SimpleAggregator");
    aggregator = await SimpleAggregator.deploy(owner.address, DECIMALS);
    await aggregator.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await aggregator.owner()).to.equal(owner.address);
    });

    it("Should set the correct decimals", async function () {
      expect(await aggregator.getDecimals()).to.equal(DECIMALS);
    });

    it("Should initialize with zero values", async function () {
      expect(await aggregator.latestAnswer()).to.equal(0);
      expect(await aggregator.latestRound()).to.equal(0);
      expect(await aggregator.latestTimestamp()).to.be.gt(0);
    });

    it("Should revert with zero address owner", async function () {
      await expect(
        SimpleAggregator.deploy(ethers.constants.AddressZero, DECIMALS)
      ).to.be.revertedWith("SimpleAggregator: owner cannot be zero address");
    });

    it("Should revert with zero decimals", async function () {
      await expect(
        SimpleAggregator.deploy(owner.address, 0)
      ).to.be.revertedWith("SimpleAggregator: decimals must be greater than 0");
    });
  });

  describe("Owner Management", function () {
    it("Should transfer ownership", async function () {
      await aggregator.setOwner(addr1.address);
      expect(await aggregator.owner()).to.equal(addr1.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(aggregator.setOwner(addr1.address))
        .to.emit(aggregator, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("Should revert when non-owner tries to transfer ownership", async function () {
      await expect(
        aggregator.connect(addr1).setOwner(addr2.address)
      ).to.be.revertedWith("SimpleAggregator: caller is not the owner");
    });

    it("Should revert when transferring to zero address", async function () {
      await expect(
        aggregator.setOwner(ethers.constants.AddressZero)
      ).to.be.revertedWith("SimpleAggregator: new owner cannot be zero address");
    });
  });

  describe("Price Updates", function () {
    it("Should update price successfully", async function () {
      await aggregator.updateAnswer(INITIAL_PRICE);
      
      expect(await aggregator.latestAnswer()).to.equal(INITIAL_PRICE);
      expect(await aggregator.latestRound()).to.equal(1);
    });

    it("Should emit AnswerUpdated event", async function () {
      await expect(aggregator.updateAnswer(INITIAL_PRICE))
        .to.emit(aggregator, "AnswerUpdated")
        .withArgs(INITIAL_PRICE, 1);
    });

    it("Should increment round on each update", async function () {
      await aggregator.updateAnswer(INITIAL_PRICE);
      await aggregator.updateAnswer(INITIAL_PRICE.add(1000));
      
      expect(await aggregator.latestRound()).to.equal(2);
    });

    it("Should update timestamp on price update", async function () {
      const beforeTime = await aggregator.latestTimestamp();
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await aggregator.updateAnswer(INITIAL_PRICE);
      const afterTime = await aggregator.latestTimestamp();
      
      expect(afterTime).to.be.gt(beforeTime);
    });

    it("Should revert when non-owner tries to update price", async function () {
      await expect(
        aggregator.connect(addr1).updateAnswer(INITIAL_PRICE)
      ).to.be.revertedWith("SimpleAggregator: caller is not the owner");
    });

    it("Should revert with zero or negative price", async function () {
      await expect(
        aggregator.updateAnswer(0)
      ).to.be.revertedWith("SimpleAggregator: answer must be positive");
      
      await expect(
        aggregator.updateAnswer(-1)
      ).to.be.revertedWith("SimpleAggregator: answer must be positive");
    });
  });

  describe("Latest Round Data", function () {
    beforeEach(async function () {
      await aggregator.updateAnswer(INITIAL_PRICE);
    });

    it("Should return correct round data", async function () {
      const roundData = await aggregator.latestRoundData();
      
      expect(roundData.roundId).to.equal(1);
      expect(roundData.answer).to.equal(INITIAL_PRICE);
      expect(roundData.startedAt).to.be.gt(0);
      expect(roundData.updatedAt).to.be.gt(0);
      expect(roundData.answeredInRound).to.equal(1);
    });

    it("Should have matching timestamps", async function () {
      const roundData = await aggregator.latestRoundData();
      expect(roundData.startedAt).to.equal(roundData.updatedAt);
    });
  });

  describe("View Functions", function () {
    it("Should return correct description", async function () {
      expect(await aggregator.description()).to.equal("BTC / USD");
    });

    it("Should return correct version", async function () {
      expect(await aggregator.version()).to.equal(1);
    });

    it("Should return correct decimals", async function () {
      expect(await aggregator.decimals()).to.equal(DECIMALS);
    });
  });

  describe("Multiple Updates", function () {
    it("Should handle multiple price updates correctly", async function () {
      const prices = [
        ethers.BigNumber.from("5000000000000"), // $50,000
        ethers.BigNumber.from("5500000000000"), // $55,000
        ethers.BigNumber.from("4800000000000"), // $48,000
      ];

      for (let i = 0; i < prices.length; i++) {
        await aggregator.updateAnswer(prices[i]);
        
        expect(await aggregator.latestAnswer()).to.equal(prices[i]);
        expect(await aggregator.latestRound()).to.equal(i + 1);
      }
    });
  });
});