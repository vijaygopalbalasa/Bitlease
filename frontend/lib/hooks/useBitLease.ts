// @ts-nocheck
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useEffect } from 'react'
import { CONTRACTS } from '../contracts'

// ABI imports - these would be generated from your contracts
const bBTCABI = [
  {
    inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getExchangeRate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

const LendingPoolABI = [
  {
    inputs: [{ name: "collateralAmount", type: "uint256" }, { name: "borrowAmount", type: "uint256" }],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable", 
    type: "function"
  },
  {
    inputs: [{ name: "repayAmount", type: "uint256" }, { name: "withdrawCollateral", type: "uint256" }],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserDebt",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserCollateral",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getHealthFactor", 
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const

const BTCPriceOracleABI = [
  {
    inputs: [],
    name: "getBTCPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getLastUpdated",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_newPrice", type: "uint256" }],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

const GPUOracleABI = [
  {
    inputs: [{ name: "gpuType", type: "string" }],
    name: "getGPUPriceWithFallback",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "gpuType", type: "string" }],
    name: "isGPUAvailable",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getSupportedGPUs",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const

const LeaseManagerABI = [
  {
    inputs: [
      { name: "bbtcAmount", type: "uint256" },
      { name: "gpuType", type: "string" },
      { name: "hoursRequested", type: "uint256" },
      { name: "borrower", type: "address" }
    ],
    name: "createLease",
    outputs: [{ name: "leaseId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserLeases",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const

const MockWBTCABI = [
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf", 
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export function useWBTCFaucet() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const claimWBTC = () => {
    (writeContract as any)({
      address: CONTRACTS.WBTC,
      abi: MockWBTCABI,
      functionName: 'faucet'
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    claimWBTC,
    isClaiming: isPending,
    isConfirming,
    isSuccess,
    hash
  }
}

export function useBitLeaseStaking() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  
  // Read bBTC balance
  const { data: bbtcBalance } = useReadContract({
    address: CONTRACTS.bBTC,
    abi: bBTCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read exchange rate
  const { data: exchangeRate } = useReadContract({
    address: CONTRACTS.bBTC,
    abi: bBTCABI,
    functionName: 'getExchangeRate'
  })

  // Approve WBTC for bBTC contract
  const approveWBTC = (amount: bigint) => {
    if (!address) return
    // // console.log('Approving WBTC for bBTC contract:', {
    //   spender: CONTRACTS.bBTC,
    //   amount: amount.toString()
    // })
    (writeContract as any)({
      address: CONTRACTS.WBTC,
      abi: MockWBTCABI,
      functionName: 'approve',
      args: [CONTRACTS.bBTC, amount]
    })
  }

  // Deposit function
  const deposit = (amount: bigint) => {
    if (!address) return
    // console.log('Attempting deposit:', {
    //   contract: CONTRACTS.bBTC,
    //   amount: amount.toString(),
    //   wbtcBalance: (bbtcBalance as bigint)?.toString(),
    //   address
    // })
    try {
      (writeContract as any)({
        address: CONTRACTS.bBTC,
        abi: bBTCABI,
        functionName: 'deposit',
        args: [amount, address]
      })
    } catch (error) {
      // console.error('Deposit contract call failed:', error)
    }
  }

  // Withdraw function - converts bBTC back to WBTC
  const withdraw = (amount: bigint) => {
    if (!address) return
    // console.log('Attempting withdrawal:', {
    //   contract: CONTRACTS.bBTC,
    //   amount: amount.toString(),
    //   bbtcBalance: (bbtcBalance as bigint)?.toString(),
    //   address
    // })
    try {
      (writeContract as any)({
        address: CONTRACTS.bBTC,
        abi: [
          {
            inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }],
            name: "withdraw",
            outputs: [{ name: "shares", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function"
          }
        ],
        functionName: 'withdraw',
        args: [amount, address, address]
      })
    } catch (error) {
      // console.error('Withdraw contract call failed:', error)
    }
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Debug logging
  if (hash || isPending || isConfirming || isSuccess) {
    // console.log('Staking hook state:', {
    //   hash: hash?.toString(),
    //   isPending,
    //   isConfirming, 
    //   isSuccess,
    //   bbtcBalance: bbtcBalance?.toString(),
    //   exchangeRate: exchangeRate?.toString()
    // })
  }

  return {
    bbtcBalance: bbtcBalance ? formatUnits(bbtcBalance as bigint, 8) : '0',
    exchangeRate: exchangeRate ? formatUnits(exchangeRate as bigint, 18) : '1',
    deposit,
    withdraw,
    approveWBTC,
    isDepositing: isPending,
    isConfirming,
    isSuccess,
    hash
  }
}

export function useBitLeaseLending() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // Read user debt
  const { data: userDebt } = useReadContract({
    address: CONTRACTS.LendingPool,
    abi: LendingPoolABI,
    functionName: 'getUserDebt',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read user collateral
  const { data: userCollateral } = useReadContract({
    address: CONTRACTS.LendingPool,
    abi: LendingPoolABI, 
    functionName: 'getUserCollateral',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read health factor
  const { data: healthFactor } = useReadContract({
    address: CONTRACTS.LendingPool,
    abi: LendingPoolABI,
    functionName: 'getHealthFactor',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read bBTC allowance for LendingPool
  const { data: bbtcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.bBTC,
    abi: bBTCABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.LendingPool] : undefined,
    query: { enabled: !!address }
  })

  // Read user's bBTC balance
  const { data: userBBTCBalance } = useReadContract({
    address: CONTRACTS.bBTC,
    abi: bBTCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read USDC balance of the lending pool (to check liquidity)
  const { data: poolUSDCBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'balanceOf',
    args: [CONTRACTS.LendingPool],
    query: { enabled: true }
  })

  // Read BTC price from oracle
  const { data: btcPrice } = useReadContract({
    address: CONTRACTS.BTCPriceOracle,
    abi: [
      {
        inputs: [],
        name: "getBTCPrice",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getBTCPrice',
    query: { enabled: true }
  })

  // Read last updated timestamp from oracle
  const { data: lastUpdated } = useReadContract({
    address: CONTRACTS.BTCPriceOracle,
    abi: [
      {
        inputs: [],
        name: "getLastUpdated",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getLastUpdated',
    query: { enabled: true }
  })

  // Approve bBTC for LendingPool
  const approveBBTC = (amount: bigint) => {
    // // console.log('Approving bBTC for LendingPool:', {
    //   spender: CONTRACTS.LendingPool,
    //   amount: amount.toString()
    // })
    (writeContract as any)({
      address: CONTRACTS.bBTC,
      abi: bBTCABI,
      functionName: 'approve',
      args: [CONTRACTS.LendingPool, amount]
    })
  }

  // Borrow function
  const borrow = (collateralAmount: bigint, borrowAmount: bigint) => {
    const currentTime = Math.floor(Date.now() / 1000)
    const isOracleStale = lastUpdated ? (currentTime - Number(lastUpdated)) > 3600 : false
    
    // Calculate expected LTV for debugging
    const expectedCollateralValue = btcPrice ? (collateralAmount * btcPrice) / BigInt(1e8) : 0n
    const expectedMaxBorrow = expectedCollateralValue ? (expectedCollateralValue * BigInt(5000)) / BigInt(10000) : 0n // 50% LTV
    const ltvCheck = borrowAmount <= expectedMaxBorrow
    
    // console.log('Attempting to borrow:', {
    //   collateralAmount: collateralAmount.toString(),
    //   borrowAmount: borrowAmount.toString(),
    //   lendingPool: CONTRACTS.LendingPool,
    //   currentAllowance: bbtcAllowance?.toString(),
    //   userBalance: userBBTCBalance?.toString(),
    //   poolUSDCBalance: poolUSDCBalance?.toString(),
    //   hasEnoughAllowance: bbtcAllowance ? bbtcAllowance >= collateralAmount : false,
    //   hasEnoughBalance: userBBTCBalance ? userBBTCBalance >= collateralAmount : false,
    //   poolHasEnoughLiquidity: poolUSDCBalance ? poolUSDCBalance >= borrowAmount : false,
    //   // Oracle debugging
    //   btcPrice: btcPrice?.toString(),
    //   btcPriceInUSD: btcPrice ? (Number(btcPrice) / 1e8).toFixed(2) : 'N/A',
    //   lastUpdated: lastUpdated?.toString(),
    //   lastUpdatedDate: lastUpdated ? new Date(Number(lastUpdated) * 1000).toISOString() : 'N/A',
    //   currentTime: currentTime.toString(),
    //   timeSinceUpdate: lastUpdated ? (currentTime - Number(lastUpdated)) : 'N/A',
    //   isOracleStale: isOracleStale,
    //   oracleContract: CONTRACTS.BTCPriceOracle,
    //   // LTV debugging
    //   expectedCollateralValue: expectedCollateralValue.toString(),
    //   expectedMaxBorrow: expectedMaxBorrow.toString(),
    //   ltvRatio: expectedCollateralValue > 0 ? ((borrowAmount * BigInt(10000)) / expectedCollateralValue).toString() : 'N/A',
    //   ltvCheck: ltvCheck,
    //   // User position debugging
    //   currentDebt: userDebt?.toString() || '0',
    //   currentCollateral: userCollateral?.toString() || '0',
    //   currentHealthFactor: healthFactor?.toString() || 'N/A'
    // })
    
    // Check if user has enough balance
    if (!userBBTCBalance || userBBTCBalance < collateralAmount) {
      // console.error('Insufficient bBTC balance for collateral')
      return
    }
    
    // Check if allowance is sufficient
    if (!bbtcAllowance || bbtcAllowance < collateralAmount) {
      // console.error('Insufficient bBTC allowance for collateral')
      return
    }

    // Check if pool has enough USDC liquidity
    if (!poolUSDCBalance || poolUSDCBalance < borrowAmount) {
      // console.error('Insufficient pool liquidity for borrow amount')
      return
    }
    
    // Check if oracle is stale (contract will revert if > 1 hour)
    if (isOracleStale) {
      // console.error('BTC oracle price is stale (>1 hour old), transaction will fail. Please update the oracle first.')
      alert('⚠️ BTC Oracle Price is Stale\n\nThe BTC price oracle hasn\'t been updated in over an hour. The borrowing transaction will fail.\n\nPlease click "Update BTC Price" first, then try borrowing again.')
      return
    }
    
    // Check LTV before transaction
    if (!ltvCheck && expectedCollateralValue > 0) {
      // console.error('LTV check failed - borrow amount exceeds 50% of collateral value')
      return
    }
    
    (writeContract as any)({
      address: CONTRACTS.LendingPool,
      abi: LendingPoolABI,
      functionName: 'borrow',
      args: [collateralAmount, borrowAmount]
    })
  }

  // Repay function
  const repay = (repayAmount: bigint, withdrawCollateral: bigint) => {
    (writeContract as any)({
      address: CONTRACTS.LendingPool,
      abi: LendingPoolABI,
      functionName: 'repay',
      args: [repayAmount, withdrawCollateral]
    })
  }

  // Update BTC oracle price function
  const updateBTCPrice = async (newPriceUSD: number = 60000) => {
    try {
      const priceWith8Decimals = parseUnits(newPriceUSD.toString(), 8)
      // console.log(`Updating BTC oracle price to $${newPriceUSD}...`)
      
      (writeContract as any)({
        address: CONTRACTS.BTCPriceOracle,
        abi: BTCPriceOracleABI,
        functionName: 'updatePrice',
        args: [priceWith8Decimals]
      })
    } catch (error) {
      // console.error('Failed to update BTC price:', error)
    }
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Refetch allowance after successful transactions
  useEffect(() => {
    if (isSuccess && hash) {
      // Wait a bit for the transaction to be fully processed
      const timer = setTimeout(() => {
        refetchAllowance()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, hash, refetchAllowance])

  return {
    userDebt: userDebt ? formatUnits(userDebt as bigint, 6) : '0',
    userCollateral: userCollateral ? formatUnits(userCollateral as bigint, 8) : '0',
    healthFactor: healthFactor ? formatUnits(healthFactor as bigint, 18) : '0',
    bbtcAllowance: bbtcAllowance || 0n,
    userBBTCBalance: userBBTCBalance || 0n,
    poolUSDCBalance: poolUSDCBalance || 0n,
    btcPrice: btcPrice || 0n,
    lastUpdated: lastUpdated || 0n,
    isOracleStale: lastUpdated ? (Math.floor(Date.now() / 1000) - Number(lastUpdated)) > 3600 : false,
    borrow,
    repay,
    approveBBTC,
    updateBTCPrice,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  }
}

export function useBitLeaseGPU() {
  const { data: supportedGPUs } = useReadContract({
    address: CONTRACTS.GPUOracle,
    abi: GPUOracleABI,
    functionName: 'getSupportedGPUs'
  })

  return {
    supportedGPUs: (supportedGPUs as string[]) || []
  }
}

export function useBitLeaseGPUPrice(gpuType: string) {
  const { data: price } = useReadContract({
    address: CONTRACTS.GPUOracle,
    abi: GPUOracleABI,
    functionName: 'getGPUPriceWithFallback',
    args: [gpuType],
    query: { enabled: !!gpuType }
  })
  
  return {
    price: price ? formatUnits(price as bigint, 6) : '0',
    isLoading: !price && !!gpuType
  }
}

export function useBitLeaseGPUAvailability(gpuType: string) {
  const { data: available } = useReadContract({
    address: CONTRACTS.GPUOracle,
    abi: GPUOracleABI,
    functionName: 'isGPUAvailable',
    args: [gpuType],
    query: { enabled: !!gpuType }
  })
  
  return {
    isAvailable: !!available,
    isLoading: available === undefined && !!gpuType
  }
}

export function useBitLeaseLeases() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Get user leases
  const { data: userLeases } = useReadContract({
    address: CONTRACTS.LeaseManager,
    abi: LeaseManagerABI,
    functionName: 'getUserLeases',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Create lease
  const createLease = (bbtcAmount: bigint, gpuType: string, hours: bigint) => {
    if (!address) return
    (writeContract as any)({
      address: CONTRACTS.LeaseManager,
      abi: LeaseManagerABI,
      functionName: 'createLease',
      args: [bbtcAmount, gpuType, hours, address]
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    userLeases: (userLeases as string[]) || [],
    createLease,
    isCreatingLease: isPending,
    isConfirming,
    isSuccess,
    hash
  }
}

// Utility hook for calculations
export function useBitLeaseCalculations() {
  const calculateLeaseCost = (gpuPricePerHour: string, hours: number, platformFeePercent = 2.5) => {
    const baseCost = parseFloat(gpuPricePerHour) * hours
    const platformFee = baseCost * (platformFeePercent / 100)
    const totalCost = baseCost + platformFee
    return {
      baseCost: baseCost.toFixed(2),
      platformFee: platformFee.toFixed(2),
      totalCost: totalCost.toFixed(2)
    }
  }

  const calculateRequiredCollateral = (borrowAmountUSDC: string, ltvPercent = 50) => {
    const borrowAmount = parseFloat(borrowAmountUSDC)
    const btcPrice = 64000 // This should come from the BTC oracle
    const requiredCollateralUSD = borrowAmount / (ltvPercent / 100)
    const requiredBTC = requiredCollateralUSD / btcPrice
    return requiredBTC.toFixed(8)
  }

  return {
    calculateLeaseCost,
    calculateRequiredCollateral
  }
}