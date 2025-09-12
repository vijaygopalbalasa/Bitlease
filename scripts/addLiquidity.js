const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Adding USDC liquidity to LendingPool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "tCORE\n");

  // Contract addresses from deployment
  const addresses = {
    mockUSDC: "0x410805F439b4450fa034Bb4009E4dA86D5d195F2",
    lendingPool: "0xF5416626C8ABb9508CC71294cf3e6f3A161E166E"
  };

  // Get contract instances
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  
  const mockUSDC = MockERC20.attach(addresses.mockUSDC);
  const lendingPool = LendingPool.attach(addresses.lendingPool);

  // Check current balances
  const deployerUSDC = await mockUSDC.balanceOf(deployer.address);
  const poolUSDC = await mockUSDC.balanceOf(lendingPool.address);
  
  console.log("📊 Current Balances:");
  console.log("Deployer USDC:", ethers.utils.formatUnits(deployerUSDC, 6));
  console.log("Pool USDC:", ethers.utils.formatUnits(poolUSDC, 6));
  console.log("");

  // Mint additional USDC if needed
  const supplyAmount = ethers.utils.parseUnits("100000", 6); // 100k USDC
  if (deployerUSDC.lt(supplyAmount)) {
    console.log("💰 Minting additional USDC for liquidity...");
    await mockUSDC.mint(deployer.address, supplyAmount);
    console.log("✅ Minted 100,000 USDC");
  }

  // Approve USDC spending
  console.log("🔐 Approving USDC for LendingPool...");
  await mockUSDC.approve(lendingPool.address, supplyAmount);
  console.log("✅ Approved 100,000 USDC");

  // Supply liquidity to pool
  console.log("💧 Adding liquidity to pool...");
  const tx = await lendingPool.supply(supplyAmount);
  await tx.wait();
  console.log("✅ Successfully supplied 100,000 USDC to lending pool");
  console.log("📝 Transaction:", tx.hash);

  // Check final balances
  const finalPoolUSDC = await mockUSDC.balanceOf(lendingPool.address);
  console.log("\n📊 Final Pool Balance:");
  console.log("Pool USDC:", ethers.utils.formatUnits(finalPoolUSDC, 6));
  
  console.log("\n🎉 Liquidity added successfully!");
  console.log("Users can now borrow USDC against bBTC collateral!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });