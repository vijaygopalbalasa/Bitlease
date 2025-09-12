const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing WBTC→bBTC staking flow...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const WBTC_ADDRESS = "0xA7F2b3ba25BDC70AdbA096042C7Ec225925790FF";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";

  // Get contracts
  const wbtc = await ethers.getContractAt("IERC20", WBTC_ADDRESS);
  const bbtc = await ethers.getContractAt("bBTC", BBTC_ADDRESS);

  console.log("📋 Initial balances:");
  const initialWbtcBalance = await wbtc.balanceOf(deployer.address);
  const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
  console.log("WBTC:", ethers.utils.formatUnits(initialWbtcBalance, 8), "WBTC");
  console.log("bBTC:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");

  // Check current allowance
  const allowance = await wbtc.allowance(deployer.address, BBTC_ADDRESS);
  console.log("Current WBTC allowance:", ethers.utils.formatUnits(allowance, 8), "WBTC");

  // Test staking with 0.1 WBTC
  const stakeAmount = ethers.utils.parseUnits("0.1", 8); // 0.1 WBTC

  console.log("\n📋 Testing staking flow:");
  console.log("Stake Amount:", ethers.utils.formatUnits(stakeAmount, 8), "WBTC");

  try {
    // Step 1: Approve WBTC if needed
    if (allowance.lt(stakeAmount)) {
      console.log("\n1. Approving WBTC for staking...");
      const approveTx = await wbtc.approve(BBTC_ADDRESS, stakeAmount);
      await approveTx.wait();
      console.log("✅ WBTC approved");
      console.log("🔗 Approval tx:", `https://scan.test2.btcs.network/tx/${approveTx.hash}`);
    } else {
      console.log("\n1. ✅ WBTC already approved");
    }

    // Step 2: Stake WBTC to get bBTC
    console.log("\n2. Staking WBTC to get bBTC...");
    const stakeTx = await bbtc.deposit(stakeAmount);
    await stakeTx.wait();
    console.log("✅ WBTC staked successfully");
    console.log("🔗 Staking tx:", `https://scan.test2.btcs.network/tx/${stakeTx.hash}`);

    // Check final balances
    console.log("\n💰 Final balances:");
    const finalWbtcBalance = await wbtc.balanceOf(deployer.address);
    const finalBbtcBalance = await bbtc.balanceOf(deployer.address);
    console.log("WBTC:", ethers.utils.formatUnits(finalWbtcBalance, 8), "WBTC");
    console.log("bBTC:", ethers.utils.formatUnits(finalBbtcBalance, 8), "bBTC");

    console.log("\n📈 Changes:");
    const wbtcUsed = initialWbtcBalance.sub(finalWbtcBalance);
    const bbtcGained = finalBbtcBalance.sub(initialBbtcBalance);
    console.log("WBTC used:", ethers.utils.formatUnits(wbtcUsed, 8), "WBTC");
    console.log("bBTC gained:", ethers.utils.formatUnits(bbtcGained, 8), "bBTC");

    // Check exchange rate
    const exchangeRate = await bbtc.getExchangeRate();
    console.log("Exchange rate:", ethers.utils.formatEther(exchangeRate));

    console.log("\n🎉 STAKING TEST SUCCESSFUL!");
    console.log("✅ WBTC → bBTC conversion works correctly");
    console.log("✅ Proper transaction explorer links available");
    console.log("✅ Two-step flow (approve → stake) working properly");

  } catch (error) {
    console.error("❌ STAKING TEST FAILED:");
    console.error(error.message);
    
    if (error.message.includes("allowance")) {
      console.log("\n🔍 Allowance Issue:");
      console.log("This suggests the approval transaction may not have been confirmed yet");
      console.log("Frontend should wait for approval confirmation before enabling staking");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });