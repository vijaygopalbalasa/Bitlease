import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS } from '../contracts'

// ABI for the Fresh BTC Oracle (BTCOracle contract)
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
  },
  {
    inputs: [{ name: "newPrice", type: "uint256" }],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable", 
    type: "function"
  }
] as const

/**
 * Hook to get BTC price directly from the fresh BTC Oracle
 * This ensures frontend and contract use identical pricing
 */
export function useContractBTCPrice() {
  // Get the latest price with timestamp from the fresh BTC Oracle
  const { data: priceData, isError, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BTCPriceOracle,
    abi: BTC_ORACLE_ABI,
    functionName: 'getPriceWithTimestamp',
  })

  // Get current price separately for redundancy
  const { data: currentPrice } = useReadContract({
    address: CONTRACTS.BTCPriceOracle, 
    abi: BTC_ORACLE_ABI,
    functionName: 'getLatestPrice',
  })

  // Price update functionality
  const { writeContract, data: updateHash, isPending: isUpdating, error: updateError } = useWriteContract()
  const { isLoading: isConfirmingUpdate, isSuccess: updateSuccess } = useWaitForTransactionReceipt({
    hash: updateHash,
  })

  // Extract data from fresh BTC Oracle response  
  const contractPrice6 = priceData?.[0] ? priceData[0] : currentPrice // 6-decimal price (uint256)
  const lastUpdated = priceData?.[1] ? Number(priceData[1]) : null

  // Check staleness based on timestamp (5 minutes = 300 seconds)
  const now = Math.floor(Date.now() / 1000)
  const isStale = !lastUpdated || (now - lastUpdated > 300)

  // Convert 6-decimal price for display and calculations
  const contractPrice = contractPrice6 ? contractPrice6 : null // Keep as BigInt for calculations
  const price = contractPrice6 ? Number(contractPrice6) / 1e6 : null // Convert to USD
  const priceInWei = contractPrice // Keep as 6-decimal BigInt for calculations

  // Update contract price function for fresh oracle
  const updateContractPrice = async (newPriceUSD: number) => {
    const priceWith6Decimals = newPriceUSD * 1000000; // Convert to 6 decimals
    
    (writeContract as any)({
      address: CONTRACTS.BTCPriceOracle,
      abi: BTC_ORACLE_ABI, 
      functionName: 'updatePrice',
      args: [BigInt(priceWith6Decimals)]
    })
  }

  return {
    price, // Price in USD (e.g., 115577.0)
    priceInWei, // Price in wei format for calculations (115577000000n) 
    contractPrice, // 6-decimal BigInt format
    priceFormatted: price ? `$${price.toFixed(2)}` : 'Loading...',
    lastUpdated,
    isLoading,
    isError,
    isStale,
    refetch,
    updateContractPrice,
    isUpdating, // Real update status from writeContract
    isConfirmingUpdate,
    updateSuccess,
    updateError,
    source: 'fresh-btc-oracle' as const
  }
}