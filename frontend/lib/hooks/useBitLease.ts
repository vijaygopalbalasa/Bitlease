// @ts-nocheck
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useEffect } from 'react'
import { CONTRACTS } from '../contracts'
import { useHybridBTCOracle } from './useHybridBTCOracle'

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
    inputs: [{ name: "assets", type: "uint256" }],
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
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const

const MockUSDCABI = [
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

export function useUSDCFaucet() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { address } = useAccount()
  
  const claimUSDC = () => {
    (writeContract as any)({
      address: CONTRACTS.USDC,
      abi: MockUSDCABI,
      functionName: 'faucet'
    })
  }

  // Function to transfer USDC to lending pool for liquidity
  const addLiquidityToPool = (amount: bigint) => {
    if (!address) return
    (writeContract as any)({
      address: CONTRACTS.USDC,
      abi: MockUSDCABI,
      functionName: 'transfer',
      args: [CONTRACTS.LendingPool, amount]
    })
  }

  // Combined function: claim USDC and add to pool
  const claimAndAddLiquidity = async () => {
    // First claim USDC
    claimUSDC()
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    claimUSDC,
    addLiquidityToPool,
    claimAndAddLiquidity,
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

  // Read allowance to check if approval is needed
  const { data: allowance } = useReadContract({
    address: CONTRACTS.WBTC,
    abi: MockWBTCABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.bBTC] : undefined,
    query: { enabled: !!address }
  })

  // Approve WBTC for bBTC contract
  const approveWBTC = (amount: bigint) => {
    if (!address) return
    (writeContract as any)({
      address: CONTRACTS.WBTC,
      abi: MockWBTCABI,
      functionName: 'approve',
      args: [CONTRACTS.bBTC, amount],
      gas: BigInt("100000") // Manual gas limit for testnet
    })
  }

  // Deposit function
  const deposit = (amount: bigint) => {
    if (!address) return
    
    // Pre-flight checks
    if (!allowance || allowance < amount) {
      console.error('Insufficient allowance for deposit:', {
        required: amount.toString(),
        current: allowance?.toString() || '0'
      })
      alert('❌ Insufficient WBTC allowance. Please approve WBTC tokens first.')
      return
    }
    
    // Debug logging
    console.log('Deposit attempt:', {
      contract: CONTRACTS.bBTC,
      amount: amount.toString(),
      receiver: address,
      allowance: allowance?.toString(),
      isAllowanceSufficient: allowance >= amount,
      wbtcContract: CONTRACTS.WBTC
    })
    
    try {
      // Try the single parameter deposit function first (ERC4626 standard)
      (writeContract as any)({
        address: CONTRACTS.bBTC,
        abi: [
          {
            inputs: [{ name: "assets", type: "uint256" }],
            name: "deposit",
            outputs: [{ name: "shares", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function"
          }
        ],
        functionName: 'deposit',
        args: [amount],
        gas: BigInt("300000"), // Increased gas limit
        gasPrice: BigInt("20000000000") // 20 gwei for testnet
      })
    } catch (error) {
      console.error('Deposit contract call failed, trying alternative signature:', error)
      
      // Fallback to two-parameter version
      try {
        (writeContract as any)({
          address: CONTRACTS.bBTC,
          abi: bBTCABI,
          functionName: 'deposit',
          args: [amount, address],
          gas: BigInt("300000"), // Increased gas limit
          gasPrice: BigInt("20000000000") // 20 gwei for testnet
        })
      } catch (fallbackError) {
        console.error('Both deposit signatures failed:', fallbackError)
        alert('❌ Deposit transaction failed. The smart contract may have issues.')
      }
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
    bbtcBalance: bbtcBalance ? formatUnits(bbtcBalance as bigint, 8) : '0', // Reverted: bBTC uses 8 decimals like WBTC
    exchangeRate: exchangeRate ? formatUnits(exchangeRate as bigint, 18) : '1',
    allowance: allowance || 0n,
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

  // Professional Hybrid BTC Oracle - combines contract + API sources for maximum reliability
  const { price: btcPriceUSD, priceInWei: btcPrice, lastUpdated, isStale, error: priceError, sourceCount, contractPrice, hybridMode } = useHybridBTCOracle()
  
  // Use hybrid oracle price for all calculations (contract-first, API fallback)
  const calculationBTCPrice = btcPrice

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

  // BTC price now comes from professional oracle above

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
    // Check professional oracle status
    if (priceError) {
      console.error('❌ VALIDATION FAILED: Price oracle error', priceError)
      alert('❌ Unable to fetch BTC price from oracles. Please try again.')
      return
    }
    
    // Calculate expected LTV using HYBRID oracle price for maximum accuracy
    const expectedCollateralValue = calculationBTCPrice ? (collateralAmount * calculationBTCPrice) / BigInt(1e8) : 0n
    const expectedMaxBorrow = expectedCollateralValue ? (expectedCollateralValue * BigInt(5000)) / BigInt(10000) : 0n // 50% LTV - PROFESSIONAL REQUIREMENT
    const ltvCheck = borrowAmount <= expectedMaxBorrow
    
    console.log('Attempting to borrow:', {
      collateralAmount: collateralAmount.toString(),
      borrowAmount: borrowAmount.toString(),
      lendingPool: CONTRACTS.LendingPool,
      currentAllowance: bbtcAllowance?.toString(),
      userBalance: userBBTCBalance?.toString(),
      poolUSDCBalance: poolUSDCBalance?.toString(),
      hasEnoughAllowance: bbtcAllowance ? bbtcAllowance >= collateralAmount : false,
      hasEnoughBalance: userBBTCBalance ? userBBTCBalance >= collateralAmount : false,
      poolHasEnoughLiquidity: poolUSDCBalance ? poolUSDCBalance >= borrowAmount : false,
      // Professional Hybrid Oracle Price Debugging
      btcPrice: btcPrice?.toString(),
      btcPriceInUSD: btcPriceUSD ? btcPriceUSD.toFixed(2) : 'N/A',
      contractPrice: contractPrice?.toString(),
      contractPriceUSD: contractPrice ? (Number(contractPrice) / 1e8).toFixed(2) : 'N/A',
      calculationPrice: calculationBTCPrice?.toString(),
      calculationPriceUSD: calculationBTCPrice ? (Number(calculationBTCPrice) / 1e8).toFixed(2) : 'N/A',
      lastUpdated: lastUpdated?.toString(),
      lastUpdatedDate: lastUpdated ? new Date(lastUpdated * 1000).toISOString() : 'N/A',
      isOracleStale: isStale,
      oracleSourceCount: sourceCount,
      oracleMode: hybridMode,
      oracleType: 'Professional Hybrid Oracle (Contract + API)',
      // LTV debugging
      expectedCollateralValue: expectedCollateralValue.toString(),
      expectedMaxBorrow: expectedMaxBorrow.toString(),
      ltvRatio: expectedCollateralValue > 0 ? ((borrowAmount * BigInt(10000)) / expectedCollateralValue).toString() : 'N/A',
      ltvCheck: ltvCheck,
      // User position debugging
      currentDebt: userDebt?.toString() || '0',
      currentCollateral: userCollateral?.toString() || '0',
      currentHealthFactor: healthFactor?.toString() || 'N/A'
    })
    
    // Check if user has enough balance
    if (!userBBTCBalance || userBBTCBalance < collateralAmount) {
      console.error('❌ VALIDATION FAILED: Insufficient bBTC balance for collateral', {
        userBBTCBalance: userBBTCBalance?.toString(),
        requiredCollateral: collateralAmount.toString(),
        hasBalance: !!userBBTCBalance,
        hasEnoughBalance: userBBTCBalance ? userBBTCBalance >= collateralAmount : false
      })
      alert('❌ Insufficient bBTC balance for collateral')
      return
    }
    
    // Check if allowance is sufficient
    if (!bbtcAllowance || bbtcAllowance < collateralAmount) {
      console.error('❌ VALIDATION FAILED: Insufficient bBTC allowance for collateral', {
        bbtcAllowance: bbtcAllowance?.toString(),
        requiredCollateral: collateralAmount.toString(),
        hasAllowance: !!bbtcAllowance,
        hasEnoughAllowance: bbtcAllowance ? bbtcAllowance >= collateralAmount : false
      })
      alert('❌ Please approve bBTC for lending pool first')
      return
    }
    
    console.log('✅ Balance and allowance checks passed')

    // Check if pool has enough USDC liquidity
    if (!poolUSDCBalance || poolUSDCBalance < borrowAmount) {
      console.error('Insufficient pool liquidity for borrow amount:', {
        requested: borrowAmount.toString(),
        available: poolUSDCBalance?.toString() || '0',
        requestedUSDC: (Number(borrowAmount) / 1e6).toFixed(2),
        availableUSDC: poolUSDCBalance ? (Number(poolUSDCBalance) / 1e6).toFixed(2) : '0'
      })
      alert(`❌ Insufficient Pool Liquidity\n\nRequested: ${(Number(borrowAmount) / 1e6).toFixed(2)} USDC\nAvailable: ${poolUSDCBalance ? (Number(poolUSDCBalance) / 1e6).toFixed(2) : '0'} USDC\n\nThis is a testnet limitation. The pool needs more USDC liquidity.`)
      return
    }
    
    // Check if professional oracle is stale (>5 minutes)
    if (isStale) {
      console.error('❌ VALIDATION FAILED: BTC price is stale', {
        lastUpdated: lastUpdated?.toString(),
        isStale: isStale,
        sourceCount: sourceCount
      })
      alert('⚠️ BTC Price Data is Stale\n\nThe BTC price hasn\'t been updated recently. Please wait a moment and try again.')
      return
    }
    
    console.log('✅ Oracle freshness check passed')
    
    // Check LTV before transaction
    if (!ltvCheck && expectedCollateralValue > 0) {
      console.error('❌ VALIDATION FAILED: LTV check failed - borrow amount exceeds 50% of collateral value', {
        expectedCollateralValue: expectedCollateralValue.toString(),
        expectedMaxBorrow: expectedMaxBorrow.toString(),
        requestedBorrow: borrowAmount.toString(),
        ltvRatio: ((borrowAmount * BigInt(10000)) / expectedCollateralValue).toString(),
        maxLtvAllowed: '5000' // 50%
      })
      alert('❌ Borrow amount too high\n\nYou can only borrow up to 50% of your collateral value.')
      return
    }
    
    console.log('✅ LTV check passed')
    
    console.log('🚀 All validations passed - proceeding with borrow transaction...')
    
    try {
      console.log('📞 Calling writeContract with:', {
        address: CONTRACTS.LendingPool,
        functionName: 'borrow',
        args: [collateralAmount.toString(), borrowAmount.toString()],
        collateralAmountBTC: (Number(collateralAmount) / 1e8).toFixed(8) + ' bBTC',
        borrowAmountUSDC: (Number(borrowAmount) / 1e6).toFixed(2) + ' USDC'
      });
      
      (writeContract as any)({
        address: CONTRACTS.LendingPool,
        abi: LendingPoolABI,
        functionName: 'borrow',
        args: [collateralAmount, borrowAmount]
      })
      console.log('✅ Borrow transaction initiated successfully')
    } catch (error) {
      console.error('❌ Error initiating borrow transaction:', error)
    }
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

  // Professional oracle updates automatically

  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  // Enhanced transaction monitoring for lending
  useEffect(() => {
    if (hash) {
      console.log('🔍 Monitoring lending transaction:', hash);
    }
    if (isConfirming) {
      console.log('⏳ Lending transaction confirming...');
    }
    if (isSuccess) {
      console.log('✅ Lending transaction confirmed successfully!', { hash });
    }
    if (isError) {
      console.error('❌ Lending transaction failed:', receiptError);
      alert('❌ Transaction Failed\n\nThe borrowing transaction was rejected by the blockchain. Please check the transaction details.');
    }
  }, [hash, isConfirming, isSuccess, isError, receiptError])

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
    btcPriceUSD: btcPriceUSD || 0,
    lastUpdated: lastUpdated || 0,
    isOracleStale: isStale,
    oracleSourceCount: sourceCount,
    borrow,
    repay,
    approveBBTC,
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