# BTC/USD Price Oracle for Core Blockchain

A professional, production-ready Bitcoin price oracle system built for Core DAO testnet. This oracle provides reliable BTC/USD price feeds with automatic updates, staleness protection, and 18-decimal precision scaling.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CoinGecko API  │───▶│ Node.js Updater │───▶│ SimpleAggregator│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   BtcConsumer   │
                                               └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │ React Widget    │
                                               └─────────────────┘
```

### Components

- **SimpleAggregator**: Core oracle contract that stores BTC/USD prices with owner controls
- **BtcConsumer**: Consumer contract that reads from aggregator and scales to 18 decimals
- **Node.js Updater**: Automated service that fetches prices from CoinGecko and updates contracts
- **React Widget**: Professional UI component for displaying oracle prices

## 📋 Requirements

- Node.js 16+
- npm or yarn
- Core testnet account with tCORE tokens
- Private key for contract deployment/updates

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/btc-oracle
cd btc-oracle
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc.test2.btcs.network

# Optional (will be filled after deployment)
AGGREGATOR_ADDRESS=
CONSUMER_ADDRESS=
DECIMALS=8
MAX_AGE=3600
UPDATE_INTERVAL=300
```

### 3. Deploy Contracts

```bash
npm run deploy
```

Expected output:
```
🚀 Deploying BTC Oracle System to Core Testnet...

Deploying with account: 0x123...
Account balance: 1.5 tCORE

✅ SimpleAggregator deployed: 0xABC...
✅ BtcConsumer deployed: 0xDEF...
✅ Initial price updated successfully

🎉 DEPLOYMENT COMPLETE!
```

### 4. Run Tests

```bash
npm test
```

### 5. Start Price Updates

```bash
# One-time update
npm run update-price

# Continuous monitoring
npm run start-updater
```

## 📚 Detailed Guide

### Contract Deployment

The deployment script will:

1. Deploy `SimpleAggregator` with your address as owner
2. Deploy `BtcConsumer` pointing to the aggregator
3. Fetch current BTC price from CoinGecko
4. Initialize aggregator with current price
5. Save contract addresses to `.env` and `deployment.json`

### Price Updates

The updater service:

- Fetches BTC/USD price from CoinGecko API
- Scales price to 8 decimals (e.g., $50,000 → 5000000000000)
- Updates contract if price change > 0.5% OR age > 1 hour
- Handles errors gracefully with retry logic
- Monitors gas usage and wallet balance

#### Manual Price Update

```bash
# Single update
node updater/updater.js --once

# Show oracle status
node updater/updater.js --info

# Continuous monitoring
node updater/updater.js --watch
```

### Testing

Comprehensive test suite covering:

#### SimpleAggregator Tests
- Contract deployment and initialization
- Owner management and access control
- Price update functionality
- Event emissions
- Edge cases and error handling

#### BtcConsumer Tests
- Price scaling (8 decimals → 18 decimals)
- Staleness detection and rejection
- Multiple decimal precision handling
- Integration with aggregator
- View vs transaction functions

Run specific test files:
```bash
npx hardhat test test/SimpleAggregator.test.js
npx hardhat test test/BtcConsumer.test.js
```

## 🎨 Frontend Integration

### Basic Usage

```javascript
import PriceWidget from './PriceWidget';

function App() {
  return (
    <PriceWidget 
      aggregatorAddress="0x123..."
      refreshInterval={30000}
    />
  );
}
```

### Advanced Usage

```javascript
<PriceWidget
  consumerAddress="0x456..."    // Use consumer for 18-decimal precision
  refreshInterval={30000}       // Update every 30 seconds
  maxAge={3600}                // Consider stale after 1 hour
  showDetails={true}           // Show technical details
  className="my-widget"        // Custom styling
/>
```

### Widget Features

- 🎯 Real-time price updates
- ⚡ Staleness detection with visual indicators
- 📊 Technical details (round ID, decimals, timestamps)
- 🎨 Professional gradient design
- 📱 Responsive layout
- 🔄 Manual refresh capability
- ❌ Error handling with retry

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Deployer/updater private key | Required |
| `RPC_URL` | Core testnet RPC endpoint | `https://rpc.test2.btcs.network` |
| `AGGREGATOR_ADDRESS` | SimpleAggregator contract address | Set by deployment |
| `CONSUMER_ADDRESS` | BtcConsumer contract address | Set by deployment |
| `DECIMALS` | Price decimals in aggregator | `8` |
| `MAX_AGE` | Staleness threshold (seconds) | `3600` |
| `UPDATE_INTERVAL` | Auto-update interval (seconds) | `300` |

### Contract Parameters

#### SimpleAggregator
- **Owner**: Address that can update prices
- **Decimals**: Price precision (typically 8 for BTC/USD)

#### BtcConsumer  
- **Aggregator**: Address of SimpleAggregator contract
- **MaxAge**: Maximum age for price data (seconds)

## 📊 Usage Examples

### Reading Prices (Solidity)

```solidity
// Using aggregator directly (8 decimals)
SimpleAggregator aggregator = SimpleAggregator(0x123...);
(, int256 price, , uint256 updatedAt, ) = aggregator.latestRoundData();
uint8 decimals = aggregator.decimals();

// Using consumer (18 decimals, with staleness check)
BtcConsumer consumer = BtcConsumer(0x456...);
(int256 scaledPrice, uint256 timestamp) = consumer.getLatestPrice();
```

### Reading Prices (JavaScript)

```javascript
const aggregator = new ethers.Contract(address, abi, provider);

// Get raw price data
const roundData = await aggregator.latestRoundData();
const decimals = await aggregator.decimals();
const priceUSD = ethers.utils.formatUnits(roundData.answer, decimals);

console.log(`BTC Price: $${priceUSD}`);
```

## 🛠️ Development

### Project Structure

```
btc-oracle/
├── contracts/              # Solidity contracts
│   ├── SimpleAggregator.sol
│   └── BtcConsumer.sol
├── test/                   # Test files
│   ├── SimpleAggregator.test.js
│   └── BtcConsumer.test.js
├── scripts/                # Deployment scripts
│   └── deploy.js
├── updater/                # Price updater service
│   └── updater.js
├── frontend/               # React components
│   ├── PriceWidget.js
│   └── package.json
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

### Adding New Features

1. **Custom Price Sources**: Modify `updater/updater.js` to add new APIs
2. **Additional Consumers**: Create new consumer contracts for different use cases
3. **UI Enhancements**: Extend `PriceWidget.js` with new features
4. **Security**: Add multi-sig support for production deployments

### Testing New Changes

```bash
# Compile contracts
npm run compile

# Run full test suite
npm test

# Deploy to local network for testing
npm run deploy-local

# Test updater with dry run
node updater/updater.js --once
```

## 🔒 Security Considerations

### Production Deployment

⚠️ **Important**: For production use, replace the owner with a Gnosis Safe multisig:

```bash
# After deployment, transfer ownership
npx hardhat console --network core_testnet

const aggregator = await ethers.getContractAt("SimpleAggregator", "0x123...");
await aggregator.setOwner("0x...multisig_address");
```

### Best Practices

- ✅ Use hardware wallets for owner keys
- ✅ Set up monitoring and alerting
- ✅ Implement price deviation limits  
- ✅ Use multiple price sources
- ✅ Regular security audits
- ✅ Emergency pause mechanisms

## 📈 Monitoring

### Health Checks

Monitor these metrics:

- Price update frequency
- Price deviation from other sources
- Contract gas usage
- Updater wallet balance
- Network connectivity

### Alerting Setup

```bash
# Example monitoring script
node updater/updater.js --info

# Check if price is stale
curl -X POST https://your-monitoring-webhook.com \
  -d "alert=stale_price&age=7200"
```

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check account balance
npx hardhat console --network core_testnet
await ethers.provider.getBalance("0x123...")

# Get tCORE from faucet
# Visit: https://scan.test2.btcs.network/faucet
```

#### Price Updates Fail
```bash
# Check if you're the owner
node updater/updater.js --info

# Verify contract address
grep AGGREGATOR_ADDRESS .env
```

#### Widget Not Loading
```bash
# Check RPC connection
curl -X POST https://rpc.test2.btcs.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Verify contract addresses in widget props
```

### Error Messages

| Error | Solution |
|-------|----------|
| `caller is not the owner` | Use owner's private key |
| `insufficient funds` | Get tCORE from faucet |
| `price data is stale` | Run price update |
| `network error` | Check RPC URL |

## 📄 API Reference

### SimpleAggregator

```solidity
constructor(address _owner, uint8 _decimals)
function setOwner(address newOwner) external onlyOwner
function updateAnswer(int256 answer) external onlyOwner
function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80)
function decimals() external view returns (uint8)
```

### BtcConsumer

```solidity
constructor(address _aggregator, uint256 _maxAge)
function getLatestPrice() external returns (int256, uint256)
function viewLatestPrice() external view returns (int256, uint256, bool)
function isStale() external view returns (bool)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow Solidity style guide
- Write comprehensive tests
- Update documentation
- Use conventional commits
- Add gas optimization notes

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Core DAO Testnet Explorer](https://scan.test2.btcs.network)
- [Core DAO Faucet](https://scan.test2.btcs.network/faucet)
- [Core DAO Documentation](https://docs.coredao.org)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Hardhat Documentation](https://hardhat.org/docs)

## ✅ Test Output Examples

### Unit Test Results
```
  SimpleAggregator
    ✓ Should set the correct owner (45ms)
    ✓ Should set the correct decimals
    ✓ Should initialize with zero values
    ✓ Should transfer ownership
    ✓ Should update price successfully
    ✓ Should emit AnswerUpdated event
    
  BtcConsumer  
    ✓ Should scale 8-decimal price to 18 decimals
    ✓ Should detect stale price
    ✓ Should revert when calling getLatestPrice with stale data
    ✓ Should handle different decimal precisions
    
  18 passing (2.1s)
```

### Deployment Output
```
🚀 Deploying BTC Oracle System to Core Testnet...

Deploying with account: 0x1C8cd0c38F8DE35d6056c7C7aBFa7e65D260E816
Account balance: 1.891653696 tCORE

📋 Configuration:
Owner: 0x1C8cd0c38F8DE35d6056c7C7aBFa7e65D260E816
Decimals: 8
Max Age: 3600 seconds

1️⃣ Deploying SimpleAggregator...
✅ SimpleAggregator deployed: 0x321440a843027E339A9aEA0d307583fA47bdBf80

2️⃣ Deploying BtcConsumer...
✅ BtcConsumer deployed: 0x5B1F8C5e2A7B3E4C9D8F1A2B3C4D5E6F7A8B9C0D

3️⃣ Initializing with current BTC price...
Current BTC Price: $115482.49
Scaled Price: 11548249000000
✅ Initial price updated successfully

🎉 DEPLOYMENT COMPLETE!
```

---

**Built for Core DAO Ecosystem** 🧡  
*Professional Oracle Infrastructure for DeFi Applications*