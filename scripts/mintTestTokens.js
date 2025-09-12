const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Minting test tokens for testing...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Minting for account:", deployer.address);

  // Contract addresses from deployed-addresses.json
  const WBTC_ADDRESS = "0xA7F2b3ba25BDC70AdbA096042C7Ec225925790FF";
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";

  // Get contracts
  const wbtc = await ethers.getContractAt("IERC20", WBTC_ADDRESS);
  const bbtc = await ethers.getContractAt("bBTC", BBTC_ADDRESS);

  console.log("📋 Current balances:");
  const wbtcBalance = await wbtc.balanceOf(deployer.address);
  const bbtcBalance = await bbtc.balanceOf(deployer.address);
  console.log("WBTC:", ethers.utils.formatUnits(wbtcBalance, 8), "WBTC");
  console.log("bBTC:", ethers.utils.formatUnits(bbtcBalance, 8), "bBTC");

  // Deposit 1 WBTC to get bBTC for testing
  const depositAmount = ethers.utils.parseUnits("1", 8); // 1 WBTC

  console.log("\n📋 Depositing 1 WBTC to get bBTC...");
  
  // Approve WBTC for bBTC
  console.log("1. Approving WBTC...");
  const approveTx = await wbtc.approve(BBTC_ADDRESS, depositAmount);
  await approveTx.wait();
  console.log("✅ Approved");

  // Deposit WBTC to get bBTC
  console.log("2. Depositing WBTC to bBTC...");
  const depositTx = await bbtc.deposit(depositAmount);
  await depositTx.wait();
  console.log("✅ Deposited");

  // Check new balances
  const newWbtcBalance = await wbtc.balanceOf(deployer.address);
  const newBbtcBalance = await bbtc.balanceOf(deployer.address);
  console.log("\n💰 New balances:");
  console.log("WBTC:", ethers.utils.formatUnits(newWbtcBalance, 8), "WBTC");
  console.log("bBTC:", ethers.utils.formatUnits(newBbtcBalance, 8), "bBTC");

  console.log("\n🎉 TOKEN MINTING COMPLETE!");
  console.log("Ready to test borrowing USDC with bBTC collateral");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });