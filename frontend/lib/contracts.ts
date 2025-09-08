import { Address } from 'viem'

// Contract addresses - Working addresses that show WBTC balances
export const CONTRACTS: Record<string, Address> = {
  bBTC: '0x9a0B35613E212C3dB9673Ad4071E9C2257E71370',
  LendingPool: '0x35c78E577Cd4EfBd6097704BE2d52A1380e8A269', 
  LeaseManager: '0x2d06997dccD602a2CC57dE8B7f366998F075C7e2',
  BTCPriceOracle: '0xdeBe1Ad46FF9a580e9652D2636D3a25583492a7B',
  GPUOracle: '0xE88d4fE7dAA65D68E2A160Eeb4b813F5149220fF',
  WBTC: '0x824cB559596C7F538525bCCF41d006Ad1fFa6a8F',
  USDC: '0x46C924F5F9be1E6A4F87B2a000CC70d4D4027266',
} as const

export const CORE_TESTNET = {
  id: 1114,
  name: 'Core DAO Testnet',
  network: 'core-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tCORE2',
    symbol: 'tCORE2',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test2.btcs.network'],
    },
    public: {
      http: ['https://rpc.test2.btcs.network'],
    },
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.test2.btcs.network' },
  },
} as const

export const CORE_MAINNET = {
  id: 1116,
  name: 'Core DAO',
  network: 'core',
  nativeCurrency: {
    decimals: 18,
    name: 'Core',
    symbol: 'CORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.coredao.org'],
    },
    public: {
      http: ['https://rpc.coredao.org'],
    },
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.coredao.org' },
  },
} as const