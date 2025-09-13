const hre = require("hardhat");

async function main() {
  console.log("💰 FUNDING HOTFIX CONTRACT");
  
  const oldContractAddr = "0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061";
  const newContractAddr = "0x3Cf9Da00a206c8F0970488C70Aa6806a74bd573B";
  const USDCAddr = "0x256137c415A7cF80Ca7648db0A5EAD376b633aFE";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Funding from:", signer.address);
  
  const USDC = await hre.ethers.getContractFactory("ERC20");
  const usdc = USDC.attach(USDCAddr);
  
  // Check current balances
  const oldBalance = await usdc.balanceOf(oldContractAddr);
  const newBalance = await usdc.balanceOf(newContractAddr);
  const signerBalance = await usdc.balanceOf(signer.address);
  
  console.log("\nCurrent USDC balances:");
  console.log("- Old contract:", hre.ethers.utils.formatUnits(oldBalance, 6), "USDC");
  console.log("- New contract:", hre.ethers.utils.formatUnits(newBalance, 6), "USDC");
  console.log("- Signer:", hre.ethers.utils.formatUnits(signerBalance, 6), "USDC");
  
  // Fund new contract with signer's USDC (for testing)
  if (signerBalance.gt(0)) {
    console.log("\n🚀 Transferring USDC to new contract...");
    const fundAmount = hre.ethers.utils.parseUnits("300000", 6); // 300k USDC
    
    try {
      const tx = await usdc.transfer(newContractAddr, fundAmount);
      console.log("Transfer tx:", tx.hash);
      await tx.wait();
      
      const newContractBalance = await usdc.balanceOf(newContractAddr);
      console.log("✅ New contract funded with:", hre.ethers.utils.formatUnits(newContractBalance, 6), "USDC");
    } catch (error) {
      console.log("❌ Transfer failed:", error.message);
    }
  } else {
    console.log("\n⚠️ Signer has no USDC to transfer");
    console.log("The treasury account needs to manually fund the new contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });