import { Address } from 'viem'

// Contract addresses - Updated with latest deployment
export const CONTRACTS: Record<string, Address> = {
  bBTC: '0xEedc241a5D88e3219933cD19E0Ba4FbC3F6a0b3f',
  LendingPool: '0x5BFEA3C0becf2251EB1Fd5df5865A323d98daFb6', 
  LeaseManager: '0x8567B7A4a327Bd1208d841998D2698042Fbd70D4',
  BTCPriceOracle: '0xE4e0954CCb4e78621a9Cf2B196fFed1bc70b3C55', // Using GPU Oracle for now
  GPUOracle: '0xE4e0954CCb4e78621a9Cf2B196fFed1bc70b3C55',
  WBTC: '0xCcEBD2074f24EFe90aB2d908e22fe083a140597D',
  USDC: '0x7D13e2e0E0c3370584815cb70570000878970EE3',
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