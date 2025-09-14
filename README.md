# 🟠 BitLease - Bitcoin-Backed Asset Leasing

> Turn your Bitcoin into productive capital for real-world asset leasing while earning 5.5% APY

BitLease is the first protocol that lets you **collateralize staked Bitcoin (bBTC)** to access **GPUs, storage, vehicles, and real estate** - while your BTC continues earning CoreDAO staking rewards.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black.svg)](https://nextjs.org/)
[![Built on CoreDAO](https://img.shields.io/badge/Built%20on-CoreDAO-orange.svg)](https://coredao.org/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- MetaMask wallet
- CoreDAO testnet tokens ([Get tCORE Faucet](https://scan.test.btcs.network/faucet))

### Installation
```bash
# Clone repository
git clone https://github.com/vijaygopalbalasa/Bitlease.git
cd Bitlease

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Copy environment file
cp .env.example .env

# Edit .env with your private key
nano .env
```

### Development Setup
```bash
# Compile smart contracts
npm run build:contracts

# Deploy contracts to CoreDAO testnet
npm run deploy:testnet

# Start frontend development server
npm run dev
```

### Production Build
```bash
# Build contracts and frontend
npm run build

# View deployed contract addresses
cat deployed-addresses.json
```

---

## 🎯 Revolutionary Two-Mode Borrowing System

BitLease implements **sophisticated anti-gaming architecture** to ensure borrowed funds are used for real assets, not speculation:

### 🔒 Mode 1: Lease Mode (Default - Anti-Gaming)

| Step | Action | Anti-Gaming Protection |
|------|--------|------------------------|
| **1. Stake BTC** | Lock Bitcoin on CoreDAO → Receive bBTC | Earn 5.5% APY while collateral |
| **2. Create Lease** | `createLease(provider, units)` | USDC **never touches borrower wallet** |
| **3. LeaseCredits** | Receive soulbound ERC-20 backed 1:1 by escrow | Non-transferable except to providers |
| **4. Provider Proof** | EIP-712 verification + 72h dispute window | Provider bond staking + reputation |
| **5. Service Delivery** | Use asset → Provider submits proof → Get paid | Auto-refund if no valid proof |

### 💸 Mode 2: Open Borrow Mode (Higher Cost)

| Feature | Restriction | Cost Premium |
|---------|-------------|--------------|
| **Direct USDC** | Traditional lending to wallet | **15% APR vs 8%** |
| **Anti-Gaming** | 48h cooldown on LP deposits | **2% origination vs 1%** |
| **Risk Premium** | Lower LTV + faster liquidation | Compensates gaming risk |

### Core Benefits
- ✅ **Non-custodial** - Bitcoin locked via CLTV, you keep keys
- ✅ **Continuous yield** - 5.5% APY continues during loans  
- ✅ **Gaming-resistant** - Escrow prevents DeFi abuse
- ✅ **Tax-efficient** - No disposal = no capital gains
- ✅ **Provider bonds** - BTL staking ensures service delivery

---

## 🏗️ Technical Architecture

### Smart Contract System
```
Bitcoin Mainnet → CoreDAO Staking → BitLease Protocol
     ↓               ↓                    ↓
  CLTV Lock      bBTC Minting         Asset Leasing
```

### Anti-Gaming Smart Contracts

| Contract | Purpose | Anti-Gaming Feature |
|----------|---------|---------------------|
| **bBTC.sol** | ERC4626 Bitcoin staking vault | Non-custodial collateral |
| **LendingPool.sol** | Two-mode USDC lending | 48h cooldown + premium rates |
| **LeaseManager.sol** | Atomic lease creation + EIP-712 verification | Escrow + provider proofs |
| **LeaseCredits.sol** | Soulbound ERC-20 backed by escrow | Non-transferable to prevent gaming |
| **LeaseEscrow.sol** | 72h dispute resolution system | Auto-refund protection |
| **ProviderRegistry.sol** | Bonded service providers | BTL staking (1k/10k/50k tiers) |
| **BTCPriceOracle.sol** | TWAP-protected BTC pricing | Manipulation resistance |

### Contract Addresses (CoreDAO Testnet)
```
bBTC: 0xF582deB7975be1328592def5A8Bfda61295160Be
LendingPool: 0x3Cf9Da00a206c8F0970488C70Aa6806a74bd573B  
LeaseManager: 0x98796EB52155B417929668efEd70A7f4849B1E62
BTCPriceOracle: 0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C
GPUOracle: 0x70c9356Fd3705c0488028D655B4E85F6dFD74f5D
WBTC (Mock): 0xA7F2b3ba25BDC70AdbA096042C7Ec225925790FF
USDC (Mock): 0x256137c415A7cF80Ca7648db0A5EAD376b633aFE
```

---

## 📱 Frontend Application

### Available Pages
| Route | Purpose | Features |
|-------|---------|----------|
| **/** | Landing page | Hero, benefits, how-it-works |
| **/stake** | Bitcoin staking | Deposit WBTC → Mint bBTC |
| **/lease** | Asset leasing | GPU selection, borrowing USDC |
| **/dashboard** | Portfolio | Active positions, history, analytics |

### Tech Stack
- **Framework**: Next.js 14.2.5 with TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Web3**: Wagmi 2.x + Viem + WalletConnect
- **State**: React Context + TanStack Query
- **Network**: CoreDAO (Testnet: 1114, Mainnet: 1116)

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
npm run build:contracts

# Run tests  
npm test

# Deploy to CoreDAO testnet
npm run deploy:testnet

# Verify contracts on CoreScan
npm run verify <CONTRACT_ADDRESS>
```

### Frontend Development
```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Type checking
cd frontend && npx tsc --noEmit
```

### Full Stack Development
```bash
# Build everything (contracts + frontend)
npm run build

# Start frontend only
npm run dev

# Check deployed addresses
cat deployed-addresses.json
```

---

## 📊 Development Roadmap

| Phase | Timeline | Asset Category | Implementation Status |
|-------|----------|----------------|----------------------|
| **Phase 1** | **Q1 2025** | GPU Compute (A100, V100, H100) | 🟢 **Active Development** |
| **Phase 2** | Q2 2025 | Cloud Storage (Filecoin, Arweave) | 🟡 Design Phase |
| **Phase 3** | Q3 2025 | EV Charging Networks | 🔵 Planned |
| **Phase 4** | Q4 2025 | Vehicle & Equipment Rental | 🔵 Planned |
| **Phase 5** | Q1 2026 | Real Estate & Commercial Space | 🔵 Planned |

---

## 💰 Tokenomics (BTL Token)

| Allocation | Percentage | Purpose | Vesting |
|------------|------------|---------|---------|
| Community Airdrop | 40% | BTC stakers & early users | 6 months cliff |
| Team & Advisors | 20% | Core contributors | 4-year linear |
| CoreDAO Grant | 20% | Ecosystem development | 2-year linear |
| DAO Treasury | 20% | Governance & operations | Community controlled |

**Revenue Distribution:**
- **70%** → USDC Lenders
- **20%** → BTL Token Buyback
- **10%** → Protocol Treasury

---

## 🔐 Security Features

### Risk Management
- **Conservative LTV**: 50% (Lease Mode) / 40% (Open Mode)
- **Liquidation Threshold**: 75% to protect lenders
- **Oracle Protection**: TWAP + multi-source pricing
- **Dispute Resolution**: 72h window with automated outcomes

### Audit Status
- **Smart Contracts**: Under review
- **Frontend Security**: Wallet-only state management
- **Infrastructure**: Non-custodial design
- **Bug Bounty**: Coming soon

---

## 📄 Documentation

- **Whitepaper**: [public/whitepaper.html](./frontend/public/whitepaper.html)
- **Live Demo**: [bitlease.vercel.app](https://bitlease.vercel.app) (if deployed)
- **Smart Contracts**: [contracts/](./contracts/)
- **Frontend Code**: [frontend/](./frontend/)

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`  
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new smart contract functions
- Update documentation for new features
- Test on CoreDAO testnet before mainnet

---

## 📞 Support & Community

- **Twitter**: [@bitleasehq](https://x.com/bitleasehq)
- **GitHub Issues**: [Report bugs](https://github.com/vijaygopalbalasa/Bitlease/issues)
- **Email**: Contact via GitHub issues

---

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **CoreDAO Foundation** - Bitcoin staking infrastructure
- **OpenZeppelin** - Secure smart contract libraries  
- **Wagmi Team** - Web3 React hooks
- **The Bitcoin Community** - Inspiration for real-world utility

---

**Built with ❤️ on CoreDAO**

*BitLease: The first protocol to turn idle Bitcoin into productive capital for real-world asset leasing.*