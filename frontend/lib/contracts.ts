import { Address } from 'viem'

// Contract addresses - Updated with latest deployment
export const CONTRACTS: Record<string, Address> = {
  bBTC: '0x11a555338C5b504920EE6a475CaD79A4A8e12428',
  LendingPool: '0xF5416626C8ABb9508CC71294cf3e6f3A161E166E', 
  LeaseManager: '0x84C7118F9f0e1cf521011A02b7B64ac5112f7317',
  BTCPriceOracle: '0x321440a843027E339A9aEA0d307583fA47bdBf80', // New BTC Oracle with getLatestPrice()
  GPUOracle: '0x92f2ee2242519275cCd2E97b656C539E8119953E',
  WBTC: '0x1ea1D41C571EDfafc3F83DB0b075a4be7268821d',
  USDC: '0x410805F439b4450fa034Bb4009E4dA86D5d195F2',
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