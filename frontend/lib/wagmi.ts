import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'wagmi';

// Define CoreDAO networks
const coreTestnet = {
  id: 1114,
  name: 'Core Testnet',
  nativeCurrency: { name: 'tCORE2', symbol: 'tCORE2', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.test2.btcs.network'] },
  },
  blockExplorers: {
    default: {
      name: 'CoreScan Testnet',
      url: 'https://scan.test2.btcs.network',
    },
  },
} as const;

const coreMainnet = {
  id: 1116,
  name: 'Core',
  nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.coredao.org'] },
  },
  blockExplorers: {
    default: {
      name: 'CoreScan',
      url: 'https://scan.coredao.org',
    },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '80f9b73154dcae39b653674ecf802554';

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set')
}

export const networks = [coreTestnet, coreMainnet];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig;

// Create the AppKit instance (singleton)
let appKitInstance: any = null;

export const getAppKit = () => {
  if (!appKitInstance) {
    appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      networks: networks as any,
      projectId,
      metadata: {
        name: 'BitLease Protocol',
        description: 'Bitcoin-backed GPU leasing on Core DAO',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://bitlease.com',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': 'rgb(249, 115, 22)',
      } as any,
      features: {
        analytics: false,
      }
    });
  }
  return appKitInstance;
};

export const appKit = getAppKit();