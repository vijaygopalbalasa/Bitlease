const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking treasury address...\n");

  const [deployer] = await ethers.getSigners();
  const LEASING_POOL_ADDRESS = "0x42d56Ca32001C292234c778b0c81603df6b01fE4";

  const lendingPool = await ethers.getContractAt("LendingPool", LEASING_POOL_ADDRESS);

  try {
    const treasury = await lendingPool.treasury();
    console.log("Treasury address:", treasury);
    console.log("Deployer address:", deployer.address);
    console.log("Same address?", treasury.toLowerCase() === deployer.address.toLowerCase());
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });