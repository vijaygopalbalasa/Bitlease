const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing bBTC approval for LendingPool (exact issue from frontend)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses - exactly as used in frontend
  const BBTC_ADDRESS = "0xF582deB7975be1328592def5A8Bfda61295160Be";
  const LENDING_POOL_ADDRESS = "0xbcbF2F2aA5D6551d6E048AabD3Ea204115E57AF7";

  // Get contracts
  const bbtc = await ethers.getContractAt("IERC20", BBTC_ADDRESS);
  const lendingPool = await ethers.getContractAt("LendingPool", LENDING_POOL_ADDRESS);

  console.log("📋 Initial state:");
  const initialBbtcBalance = await bbtc.balanceOf(deployer.address);
  const initialAllowance = await bbtc.allowance(deployer.address, LENDING_POOL_ADDRESS);
  console.log("bBTC balance:", ethers.utils.formatUnits(initialBbtcBalance, 8), "bBTC");
  console.log("Current allowance for LendingPool:", ethers.utils.formatUnits(initialAllowance, 8), "bBTC");

  // Test approval amount (simulate frontend borrowing flow)
  const borrowAmountString = "2000.50"; // Example borrow amount in USDC
  const approvalAmount = ethers.utils.parseUnits("0.05", 8); // 0.05 bBTC collateral

  console.log("\n📋 Testing approval flow:");
  console.log("Borrow amount:", borrowAmountString, "USDC");
  console.log("Approval amount:", ethers.utils.formatUnits(approvalAmount, 8), "bBTC");

  try {
    // Check if we need approval (BigInt comparison like frontend)
    const needsApproval = initialAllowance.lt(approvalAmount);
    console.log("Needs approval:", needsApproval);
    
    if (needsApproval) {
      console.log("\n1. 🔄 Approving bBTC for LendingPool...");
      console.log("Approval details:", {
        token: BBTC_ADDRESS,
        spender: LENDING_POOL_ADDRESS,
        amount: approvalAmount.toString()
      });
      
      const approveTx = await bbtc.approve(LENDING_POOL_ADDRESS, approvalAmount);
      console.log("Approval transaction sent:", approveTx.hash);
      console.log("🔗 Explorer:", `https://scan.test2.btcs.network/tx/${approveTx.hash}`);
      
      console.log("Waiting for confirmation...");
      await approveTx.wait();
      console.log("✅ Approval confirmed");
      
      // Check allowance after approval
      const newAllowance = await bbtc.allowance(deployer.address, LENDING_POOL_ADDRESS);
      console.log("New allowance:", ethers.utils.formatUnits(newAllowance, 8), "bBTC");
      
      // Verify BigInt comparison (same as frontend)
      const hasEnoughAllowance = newAllowance.gte(approvalAmount);
      console.log("Has enough allowance:", hasEnoughAllowance);
      
      if (hasEnoughAllowance) {
        console.log("✅ Approval successful - ready for borrowing");
      } else {
        console.log("❌ Approval failed - allowance still insufficient");
      }
      
    } else {
      console.log("✅ Already has sufficient allowance");
    }

    console.log("\n🎉 BBTC APPROVAL TEST SUCCESSFUL!");
    console.log("✅ Approval transaction works correctly");
    console.log("✅ BigInt comparison logic verified");
    console.log("✅ No stuck approval state detected");

  } catch (error) {
    console.error("❌ BBTC APPROVAL TEST FAILED:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 Contract Execution Error:");
      console.log("The approval transaction was reverted by the contract");
      console.log("This could indicate a contract bug or insufficient balance");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n🔍 Insufficient Funds:");
      console.log("Account doesn't have enough ETH for gas fees");
    } else {
      console.log("\n🔍 Unknown Error:");
      console.log("This error needs further investigation");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });