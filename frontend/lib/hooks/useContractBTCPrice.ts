import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS } from '../contracts'

// ABI for the Professional BTC Consumer Oracle
const BTC_CONSUMER_ABI = [
  {
    inputs: [],
    name: "viewLatestPrice",
    outputs: [
      { name: "price", type: "int256" },
      { name: "timestamp", type: "uint256" },
      { name: "isStale", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isStale",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const

/**
 * Hook to get BTC price directly from the professional BTC Consumer oracle
 * This ensures frontend and contract use identical pricing
 */
export function useContractBTCPrice() {
  // Get the latest price from the BTC Consumer oracle
  const { data: priceData, isError, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BTCPriceOracle,
    abi: BTC_CONSUMER_ABI,
    functionName: 'viewLatestPrice',
  })

  // Get staleness status separately for redundancy
  const { data: isStaleCheck } = useReadContract({
    address: CONTRACTS.BTCPriceOracle, 
    abi: BTC_CONSUMER_ABI,
    functionName: 'isStale',
  })

  // Price update functionality
  const { writeContract, data: updateHash, isPending: isUpdating, error: updateError } = useWriteContract()
  const { isLoading: isConfirmingUpdate, isSuccess: updateSuccess } = useWaitForTransactionReceipt({
    hash: updateHash,
  })

  // Extract data from BTC Consumer oracle response
  const contractPrice18 = priceData?.[0] ? priceData[0] : null // 18-decimal price (int256)
  const lastUpdated = priceData?.[1] ? Number(priceData[1]) : null 
  const isStale = priceData?.[2] ?? isStaleCheck ?? true

  // Convert 18-decimal price to 6-decimal format for backward compatibility
  const contractPrice = contractPrice18 ? BigInt(Number(contractPrice18) / 1e12) : null // Convert 18 to 6 decimals
  const price = contractPrice18 ? Number(contractPrice18) / 1e18 : null // Convert to USD
  const priceInWei = contractPrice // Keep as 6-decimal BigInt for calculations (backward compatibility)

  // BTC Consumer oracle is automatically updated - no manual update needed
  const updateContractPrice = async (newPriceUSD: number) => {
    console.log('ℹ️ BTC Consumer oracle updates automatically via professional updater service')
    console.log('💡 If price seems stale, the updater will sync it within the next update cycle')
    // Professional oracle updates automatically, no manual intervention needed
  }

  return {
    price, // Price in USD (e.g., 115577.0)
    priceInWei, // Price in wei format for calculations (115577000000n) 
    contractPrice, // Backward compatible price format
    contractPrice18, // Full 18-decimal price for precision
    priceFormatted: price ? `$${price.toFixed(2)}` : 'Loading...',
    lastUpdated,
    isLoading,
    isError,
    isStale,
    refetch,
    updateContractPrice,
    isUpdating: false, // Auto-updating oracle doesn't need manual updates
    isConfirmingUpdate: false,
    updateSuccess: true, // Always success with professional oracle
    updateError: null,
    source: 'btc-consumer-oracle' as const
  }
}