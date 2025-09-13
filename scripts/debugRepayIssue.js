const hre = require("hardhat");

async function main() {
  console.log("=== DEBUGGING REPAY ISSUE ===");
  
  const userAddr = "0x3253Ea72908f09B938DB572a690aFa005fcC1341";
  const lendingPoolAddr = "0x42d56Ca32001C292234c778b0c81603df6b01fE4";
  const failedTxHash = "0xfc6190977e513f2e29ac8f83ca60aef0c4e5b8aba59c952889f4df1034458f88";
  
  // Get contract instance
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddr);
  
  // 1. Check current user state
  console.log("\n1. CURRENT USER STATE:");
  const userData = await lendingPool.userData(userAddr);
  console.log("   borrowedAmount:", userData.borrowedAmount.toString());
  console.log("   collateralAmount:", userData.collateralAmount.toString());
  console.log("   borrowIndex:", userData.borrowIndex.toString());
  console.log("   lastUpdateTime:", userData.lastUpdateTime.toString());
  
  const currentDebt = await lendingPool.getUserDebt(userAddr);
  console.log("   getUserDebt():", currentDebt.toString());
  console.log("   borrowedAmount > 0?", userData.borrowedAmount.gt(0));
  
  // 2. Check failed transaction details
  console.log("\n2. FAILED TRANSACTION ANALYSIS:");
  const failedTx = await hre.ethers.provider.getTransaction(failedTxHash);
  const failedReceipt = await hre.ethers.provider.getTransactionReceipt(failedTxHash);
  
  console.log("   Block number:", failedTx.blockNumber);
  console.log("   Transaction status:", failedReceipt.status); // 0 = failed, 1 = success
  console.log("   Gas used:", failedReceipt.gasUsed.toString());
  
  // Decode transaction parameters
  const decoded = lendingPool.interface.parseTransaction({ data: failedTx.data });
  console.log("   Function called:", decoded.name);
  console.log("   Repay amount:", decoded.args[0].toString());
  console.log("   Withdraw collateral:", decoded.args[1].toString());
  
  // 3. Check user state at the failed transaction block
  console.log("\n3. USER STATE AT FAILED TRANSACTION BLOCK:");
  try {
    const userDataAtBlock = await lendingPool.userData(userAddr, { blockTag: failedTx.blockNumber });
    console.log("   borrowedAmount at block:", userDataAtBlock.borrowedAmount.toString());
    console.log("   collateralAmount at block:", userDataAtBlock.collateralAmount.toString());
    console.log("   borrowedAmount > 0 at block?", userDataAtBlock.borrowedAmount.gt(0));
  } catch (err) {
    console.log("   Error checking state at block:", err.message);
  }
  
  // 4. Try to simulate the repay call with current parameters
  console.log("\n4. SIMULATING REPAY CALL:");
  const repayAmount = decoded.args[0];
  const withdrawCollateral = decoded.args[1];
  
  try {
    const result = await hre.ethers.provider.call({
      to: lendingPoolAddr,
      data: lendingPool.interface.encodeFunctionData("repay", [repayAmount, withdrawCollateral]),
      from: userAddr
    });
    console.log("   ✅ Repay simulation succeeded");
  } catch (error) {
    console.log("   ❌ Repay simulation failed:");
    console.log("   Error:", error.reason || error.message);
  }
  
  // 5. Check all transactions in the block range
  console.log("\n5. CHECKING FOR OTHER TRANSACTIONS:");
  const borrowBlockNumber = 8182888; // From our earlier check
  const failedBlockNumber = failedTx.blockNumber;
  
  console.log(`   Checking blocks ${borrowBlockNumber} to ${failedBlockNumber}...`);
  
  // Look for any successful repay events
  const filter = lendingPool.filters.Repay(userAddr);
  const repayEvents = await lendingPool.queryFilter(filter, borrowBlockNumber, failedBlockNumber);
  console.log("   Found", repayEvents.length, "repay events in this range");
  
  if (repayEvents.length > 0) {
    repayEvents.forEach((event, i) => {
      console.log(`   Repay ${i + 1}:`);
      console.log("     Block:", event.blockNumber);
      console.log("     Repay amount:", event.args.repayAmount.toString());
      console.log("     Withdraw collateral:", event.args.withdrawCollateral.toString());
      console.log("     Tx hash:", event.transactionHash);
    });
  }
  
  // 6. Check if there are multiple borrow events
  const borrowFilter = lendingPool.filters.Borrow(userAddr);
  const borrowEvents = await lendingPool.queryFilter(borrowFilter, borrowBlockNumber - 1000, failedBlockNumber + 100);
  console.log("\n6. BORROW EVENTS:", borrowEvents.length);
  
  borrowEvents.forEach((event, i) => {
    console.log(`   Borrow ${i + 1}:`);
    console.log("     Block:", event.blockNumber);
    console.log("     Collateral amount:", event.args.collateralAmount.toString());
    console.log("     Borrow amount:", event.args.borrowAmount.toString());
    console.log("     Tx hash:", event.transactionHash);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });