import { Address } from 'viem'

// Contract addresses - Updated with professional BTC Oracle integration  
export const CONTRACTS: Record<string, Address> = {
  bBTC: '0xF582deB7975be1328592def5A8Bfda61295160Be',
  LendingPool: '0x9640dcbeB49c6eebed6eA6c90e1eE7c31431D061', // FIXED CONTRACT - Resolved storage corruption bug 
  LeaseManager: '0x98796EB52155B417929668efEd70A7f4849B1E62',
  BTCPriceOracle: '0x37bd6733A504978b6dE8E5AD2A215789B1FDD15C', // Fresh BTC Oracle with current price
  GPUOracle: '0x70c9356Fd3705c0488028D655B4E85F6dFD74f5D',
  WBTC: '0xA7F2b3ba25BDC70AdbA096042C7Ec225925790FF',
  USDC: '0x256137c415A7cF80Ca7648db0A5EAD376b633aFE',
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