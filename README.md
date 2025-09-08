# 🟠 BitLease - Bitcoin-Backed Asset Leasing

> Turn your Bitcoin into a credit card for real-world assets while earning 5.5% APY

BitLease is the first protocol that lets you **collateralize staked Bitcoin** to lease **GPUs, cars, solar panels, and real estate** - while your BTC continues earning rewards on CoreDAO.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask or compatible wallet

### 1-Command Setup
```bash
git clone https://github.com/your-username/bitlease.git
cd bitlease
./setup.sh
```

### Manual Setup
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Copy environment file
cp .env.example .env

# Edit .env with your private key
nano .env

# Compile contracts
npx hardhat compile

# Deploy to CoreDAO testnet
npm run deploy:testnet

# Start frontend
npm run dev:frontend
```

---

## 🎯 How It Works

BitLease enables a **3-step process** to lease real-world assets:

| Step | What Happens | User Experience |
|------|--------------|-----------------|
| **1. Stake BTC** | Lock Bitcoin on CoreDAO via CLTV timelock | Receive bBTC receipt token earning 5.5% APY |
| **2. Lease Asset** | Use bBTC as collateral to borrow USDC | Instantly lease GPU/car/solar with 50% LTV |
| **3. Repay & Unlock** | Repay USDC loan after using asset | Get Bitcoin back + earned staking rewards |

### Core Benefits
- ✅ **Non-custodial** - Your Bitcoin never leaves your wallet
- ✅ **Keep earning** - 5.5% APY continues while Bitcoin is collateral
- ✅ **No credit check** - Only Bitcoin collateral required
- ✅ **No tax events** - No disposal means no capital gains tax
- ✅ **50% cheaper** - Than AWS/traditional providers

---

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Bitcoin     │───▶│  CoreDAO     │───▶│   BitLease   │
│  Mainnet     │    │   Staking    │    │   Protocol   │
│              │    │              │    │              │
│ CLTV Lock    │    │ bBTC Mint    │    │ GPU/Car Lease│
└──────────────┘    └──────────────┘    └──────────────┘
```

### Smart Contracts

| Contract | Purpose | Address |
|----------|---------|---------|
| **bBTC.sol** | ERC4626 vault for staked Bitcoin | [View on CoreScan](https://scan.coredao.org) |
| **LendingPool.sol** | USDC lending against bBTC collateral | [View on CoreScan](https://scan.coredao.org) |
| **LeaseManager.sol** | Manages asset leases and payments | [View on CoreScan](https://scan.coredao.org) |
| **GPUOracle.sol** | Real-time GPU pricing via Chainlink | [View on CoreScan](https://scan.coredao.org) |

---

## 📱 Frontend Pages

| Page | Purpose | Features |
|------|---------|----------|
| **Landing** (`/`) | Marketing & explanation | Hero, stats, how-it-works |
| **Stake** (`/stake`) | Bitcoin staking interface | Connect wallet, stake BTC, receive bBTC |
| **Lease** (`/lease`) | GPU/asset leasing | GPU selection, pricing, lease configuration |
| **Dashboard** (`/dashboard`) | Portfolio management | Active leases, portfolio stats, activity |

---

## 🌐 Network Configuration

### CoreDAO Testnet
- **RPC**: `https://rpc.test2.btcs.network`
- **Chain ID**: `1114`
- **Faucet**: [https://scan.test.btcs.network/faucet](https://scan.test.btcs.network/faucet)
- **Explorer**: [https://scan.test.btcs.network](https://scan.test.btcs.network)

### CoreDAO Mainnet
- **RPC**: `https://rpc.coredao.org`
- **Chain ID**: `1116`
- **Explorer**: [https://scan.coredao.org](https://scan.coredao.org)

---

## 🛠️ Development Commands

### Smart Contracts
```bash
# Compile contracts
npm run build

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet  
npm run deploy:mainnet

# Verify contracts
npm run verify

# Check contract sizes
npm run size
```

### Frontend
```bash
# Start development server
npm run dev:frontend

# Build for production
npm run build:frontend

# Type checking
cd frontend && npx tsc --noEmit
```

---

## 📊 Phase Roadmap

| Phase | Timeline | Assets | Status |
|-------|----------|--------|--------|
| **Phase 1** | ✅ Q4 2025 | GPU Compute (A100, V100, H100) | **In Development** |
| **Phase 2** | 🚧 Q1 2026 | Cloud Storage (Filecoin, Arweave) | In Development |
| **Phase 3** | 📋 Q2 2026 | EV Charging Credits | Planned |
| **Phase 4** | 📋 Q3 2026 | Cars & Equipment Leasing | Planned |
| **Phase 5** | 📋 Q4 2026 | Real Estate & Solar | Planned |

---

## 💰 Tokenomics (BTL Token)

| Allocation | % | Purpose |
|------------|---|---------|
| Community Airdrop | 40% | BTC stakers & early users |
| Team & Advisors | 20% | 4-year vesting |
| CoreDAO Grant Match | 20% | Ecosystem alignment |
| DAO Treasury | 20% | Governance & development |

**Revenue Model**: 1% origination fee + 0.1% take-rate on leased assets

---

## 🔐 Security

- **Audited by**: (pending)
- **Bug Bounty**: N/A
- **Non-custodial**: Bitcoin locked via CLTV timelock
- **Liquidation**: 75% LTV threshold with automated liquidation

---

## 📄 Documentation

- [Whitepaper](./BITLEASE_COMPLETE_SPEC.md)
- [Grant Application](./COREDAO_GRANT_APPLICATION.md)
- [API Documentation](./docs/api.md)
- [Integration Guide](./docs/integration.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support & Community

- **Twitter**: [@BitLeaseProtocol](https://twitter.com/bitlease_)
- **Email**: N/A

---

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **CoreDAO Foundation** for Bitcoin staking infrastructure
- **OpenZeppelin** for secure smart contract primitives
- **Chainlink** for decentralized oracles
- **The Bitcoin Community** for inspiring real-world utility

---

**Built with ❤️ on CoreDAO**

*BitLease is the first protocol to turn idle Bitcoin into productive capital for real-world asset leasing.*
