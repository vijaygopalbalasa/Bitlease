const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Setting up testnet tokens for users...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Setting up tokens with account:", deployer.address);

  // Contract addresses
  const addresses = {
    mockUSDC: "0x410805F439b4450fa034Bb4009E4dA86D5d195F2",
    mockWBTC: "0x1ea1D41C571EDfafc3F83DB0b075a4be7268821d",
    bBTC: "0x11a555338C5b504920EE6a475CaD79A4A8e12428"
  };

  // Get contract instances
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const bBTC = await ethers.getContractFactory("bBTC");
  
  const mockUSDC = MockERC20.attach(addresses.mockUSDC);
  const mockWBTC = MockERC20.attach(addresses.mockWBTC);
  const bbtc = bBTC.attach(addresses.bBTC);

  // Mint tokens for common test addresses (you can add more addresses here)
  const testUsers = [
    "0x1C8cd0c38F8DE35d6056c7C7aBFa7e65D260E816", // Deployer (already has tokens)
    // Add more test user addresses here if needed
  ];

  console.log("💰 Minting test tokens for users...");
  
  for (const user of testUsers) {
    try {
      // Check current balances
      const usdcBalance = await mockUSDC.balanceOf(user);
      const wbtcBalance = await mockWBTC.balanceOf(user);
      const bbtcBalance = await bbtc.balanceOf(user);
      
      console.log(`\n👤 User: ${user}`);
      console.log(`Current USDC: ${ethers.utils.formatUnits(usdcBalance, 6)}`);
      console.log(`Current WBTC: ${ethers.utils.formatUnits(wbtcBalance, 8)}`);
      console.log(`Current bBTC: ${ethers.utils.formatUnits(bbtcBalance, 8)}`);
      
      // Mint additional tokens if needed
      const usdcMintAmount = ethers.utils.parseUnits("10000", 6); // 10k USDC
      const wbtcMintAmount = ethers.utils.parseUnits("1", 8); // 1 WBTC
      
      if (usdcBalance.lt(usdcMintAmount)) {
        await mockUSDC.mint(user, usdcMintAmount);
        console.log("✅ Minted 10,000 USDC");
      }
      
      if (wbtcBalance.lt(wbtcMintAmount)) {
        await mockWBTC.mint(user, wbtcMintAmount);
        console.log("✅ Minted 1 WBTC");
      }
      
    } catch (error) {
      console.log(`❌ Error setting up tokens for ${user}:`, error.message);
    }
  }
  
  console.log("\n🎉 Test token setup complete!");
  console.log("\n📋 TESTNET TOKEN ADDRESSES:");
  console.log("MOCK_USDC:", addresses.mockUSDC);
  console.log("MOCK_WBTC:", addresses.mockWBTC);
  console.log("bBTC:", addresses.bBTC);
  console.log("\n🔗 Add these tokens to MetaMask to see balances");
  console.log("Network: Core DAO Testnet (Chain ID: 1114)");
  console.log("RPC URL: https://rpc.test2.btcs.network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });