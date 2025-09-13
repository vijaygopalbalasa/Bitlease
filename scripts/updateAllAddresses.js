const fs = require('fs');
const path = require('path');

// New contract addresses
const OLD_ADDRESSES = [
  '0x485BD8041f358a20df5Ae5eb9910c1e011Bf6f1e', // Old fresh lending pool
  '0xbcbF2F2aA5D6551d6E048AabD3Ea204115E57AF7'  // Original lending pool
];

const NEW_ADDRESS = '0xC27B1396d2e478bC113abe1794A6eC701B0b28D2'; // New leasing model

console.log('🔄 Updating all contract addresses to new leasing model...\n');

// Get all JavaScript files in scripts directory
const scriptsDir = path.join(__dirname);
const files = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith('.js') && file !== 'updateAllAddresses.js')
  .map(file => path.join(scriptsDir, file));

let updatedFiles = 0;
let totalReplacements = 0;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileReplacements = 0;
    
    // Replace all old addresses with new one
    OLD_ADDRESSES.forEach(oldAddress => {
      const regex = new RegExp(oldAddress, 'g');
      const matches = content.match(regex);
      if (matches) {
        updatedContent = updatedContent.replace(regex, NEW_ADDRESS);
        fileReplacements += matches.length;
      }
    });
    
    if (fileReplacements > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${path.basename(filePath)}: ${fileReplacements} replacements`);
      updatedFiles++;
      totalReplacements += fileReplacements;
    }
  } catch (error) {
    console.error(`❌ Error updating ${path.basename(filePath)}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Files updated: ${updatedFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`New LendingPool address: ${NEW_ADDRESS}`);
console.log(`\n✅ All contract addresses updated to leasing model!`);