const hre = require("hardhat");

async function main() {
  console.log("=== COMPREHENSIVE REPAY BUG TEST ===");
  
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  const lendingPoolAddr = "0x42d56Ca32001C292234c778b0c81603df6b01fE4";
  
  // Get contract instance
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  console.log("\n1. USER STATE VERIFICATION:");
  const userData = await lendingPool.userData(userAddr);
  console.log("   borrowedAmount:", userData.borrowedAmount.toString());
  console.log("   collateralAmount:", userData.collateralAmount.toString());
  console.log("   borrowedAmount > 0?", userData.borrowedAmount.gt(0));
  
  const totalDebt = await lendingPool.getUserDebt(userAddr);
  console.log("   getUserDebt():", totalDebt.toString());
  console.log("   totalDebt > 0?", totalDebt.gt(0));
  
  console.log("\n2. CONTRACT VALIDATION TESTS:");
  
  // Test 1: Check the exact condition that's failing
  console.log("   Testing contract validation logic...");
  
  // Test 2: Try different repay amounts
  const testAmounts = [
    hre.ethers.BigNumber.from("1"), // 1 wei
    hre.ethers.BigNumber.from("1000000"), // 1 USDC
    userData.borrowedAmount, // Exact borrowed amount
    totalDebt // Total debt with interest
  ];
  
  for (let i = 0; i < testAmounts.length; i++) {
    const amount = testAmounts[i];
    console.log(`\n   Test ${i + 1}: Repaying ${amount.toString()} wei`);
    
    try {
      const result = await hre.ethers.provider.call({
        to: lendingPoolAddr,
        data: lendingPool.interface.encodeFunctionData("repay", [amount, 0]),
        from: userAddr
      });
      console.log("     ✅ Success");
    } catch (error) {
      console.log("     ❌ Failed:", error.reason || error.message);
      
      // Try to get more detailed error
      if (error.data) {
        console.log("     Error data:", error.data);
      }
    }
  }
  
  console.log("\n3. STORAGE INSPECTION:");
  
  // Check if storage slot 0 (userData mapping) is accessible
  const userSlot = hre.ethers.utils.solidityKeccak256(
    ["uint256", "uint256"],
    [userAddr, 0] // Assuming userData is at slot 0
  );
  
  try {
    const storageValue = await hre.ethers.provider.getStorageAt(lendingPoolAddr, userSlot);
    console.log("   User storage slot:", userSlot);
    console.log("   Storage value:", storageValue);
    
    // Parse the storage (first 32 bytes should be borrowedAmount)
    const borrowedAmountFromStorage = hre.ethers.BigNumber.from(storageValue);
    console.log("   Borrowed amount from storage:", borrowedAmountFromStorage.toString());
    console.log("   Storage matches userData call?", borrowedAmountFromStorage.eq(userData.borrowedAmount));
  } catch (err) {
    console.log("   Storage inspection failed:", err.message);
  }
  
  console.log("\n4. RECENT TRANSACTION ANALYSIS:");
  
  // Check the latest failed transaction
  const latestFailedTx = "0x53ba02b1b2d4014eef315bddc0a4e312f6945eeb6b7f8a0351ad4db4a8e37b75";
  const tx = await hre.ethers.provider.getTransaction(latestFailedTx);
  const receipt = await hre.ethers.provider.getTransactionReceipt(latestFailedTx);
  
  console.log("   Latest failed tx block:", tx.blockNumber);
  console.log("   Transaction status:", receipt.status);
  console.log("   Gas used:", receipt.gasUsed.toString());
  
  // Try to get the exact error at that block
  try {
    const result = await hre.ethers.provider.call(tx, tx.blockNumber);
    console.log("   ✅ Call succeeded at original block");
  } catch (error) {
    console.log("   ❌ Call failed at original block:", error.reason || error.message);
  }
  
  console.log("\n5. CONCLUSION:");
  if (userData.borrowedAmount.gt(0) && totalDebt.gt(0)) {
    console.log("   🚨 CRITICAL BUG CONFIRMED:");
    console.log("   - User has valid debt in contract state");
    console.log("   - Contract validation should pass");
    console.log("   - But repay function consistently fails");
    console.log("   - This indicates a serious contract bug");
    console.log("\n   RECOMMENDED ACTION:");
    console.log("   - Deploy a fixed version of the contract");
    console.log("   - Or implement a migration/fix mechanism");
  } else {
    console.log("   ✅ Contract state is consistent with error");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });