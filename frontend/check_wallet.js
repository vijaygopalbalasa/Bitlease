
const address = '0x3253Ea72908f09B938DB572a690aFa005fcC1341';
const wbtc = await ethers.getContractAt('MockWBTC', '0xA7F2b3ba25BDC70AdbA096042C7Ec225925790FF');
const bbtc = await ethers.getContractAt('bBTC', '0xF582deB7975be1328592def5A8Bfda61295160Be');
const usdc = await ethers.getContractAt('MockUSDC', '0x256137c415A7cF80Ca7648db0A5EAD376b633aFE');
const lending = await ethers.getContractAt('LendingPool', '0x3Cf9Da00a206c8F0970488C70Aa6806a74bd573B');

console.log('=== WALLET BALANCE CHECK ===');
console.log('Wallet:', address);
console.log('WBTC Balance:', (await wbtc.balanceOf(address)).toString());
console.log('bBTC Balance:', (await bbtc.balanceOf(address)).toString());
console.log('USDC Balance:', (await usdc.balanceOf(address)).toString());
console.log('User Debt:', (await lending.getUserDebt(address)).toString());
console.log('User Collateral:', (await lending.getUserCollateral(address)).toString());
console.log('Health Factor:', (await lending.getHealthFactor(address)).toString());
console.log('=== END CHECK ===');

