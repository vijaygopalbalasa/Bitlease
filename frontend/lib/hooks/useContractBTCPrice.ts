import { useReadContract } from 'wagmi'
import { CONTRACTS } from '../contracts'

// ABI for the BTCOracle contract
const BTC_ORACLE_ABI = [
  {
    inputs: [],
    name: "getLatestPrice",
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPriceWithTimestamp", 
    outputs: [
      { name: "price", type: "uint256" },
      { name: "timestamp", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const

/**
 * Hook to get BTC price directly from the contract oracle
 * This ensures frontend and contract use identical pricing
 */
export function useContractBTCPrice() {
  // Get the latest price from the contract oracle
  const { data: contractPrice, isError, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BTCPriceOracle,
    abi: BTC_ORACLE_ABI,
    functionName: 'getLatestPrice',
  })

  // Get price with timestamp for staleness checking
  const { data: priceWithTimestamp } = useReadContract({
    address: CONTRACTS.BTCPriceOracle, 
    abi: BTC_ORACLE_ABI,
    functionName: 'getPriceWithTimestamp',
  })

  const price = contractPrice ? Number(contractPrice) / 1e6 : null // Convert from 6 decimals to USD  
  const priceInWei = contractPrice ? contractPrice : null // Keep as 6-decimal BigInt for calculations
  
  // Check if price is stale (more than 5 minutes old)
  const lastUpdated = priceWithTimestamp?.[1] ? Number(priceWithTimestamp[1]) : null
  const isStale = lastUpdated ? (Math.floor(Date.now() / 1000) - lastUpdated) > 300 : true

  return {
    price, // Price in USD (e.g., 115577.0)
    priceInWei, // Price in wei format for calculations (115577000000n)
    contractPrice, // Raw contract price (115577000000n with 6 decimals)
    priceFormatted: price ? `$${price.toFixed(2)}` : 'Loading...',
    lastUpdated,
    isLoading,
    isError,
    isStale,
    refetch,
    source: 'contract-oracle' as const
  }
}