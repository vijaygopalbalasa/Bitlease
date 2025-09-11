"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseUnits } from 'viem';
import { CpuChipIcon, ClockIcon, CurrencyDollarIcon, ArrowRightIcon, CheckCircleIcon, InformationCircleIcon, BoltIcon, ShieldCheckIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useBitLeaseGPU, useBitLeaseGPUPrice, useBitLeaseLeases, useBitLeaseStaking, useBitLeaseLending } from '../../lib/hooks/useBitLease';
import { useProfessionalBTCPrice } from '../../lib/hooks/usePriceOracle';
import { CONTRACTS } from '../../lib/contracts';
import Link from 'next/link';

// Using professional oracle from usePriceOracle.ts

export default function LeasePage() {
  const [selectedGPU, setSelectedGPU] = useState('A100');
  const [leaseHours, setLeaseHours] = useState('24');
  const [isCreatingLease, setIsCreatingLease] = useState(false);
  const [currentStep, setCurrentStep] = useState<'borrow' | 'lease'>('borrow');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [activeGPU, setActiveGPU] = useState(0);

  const { address, isConnected } = useAccount();
  const { data: bbtcBalance } = useBalance({
    address,
    token: CONTRACTS.bBTC,
  });
  
  const { data: usdcBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });
  
  // Use professional multi-source BTC price oracle
  const { price: realBtcPrice, isLoading: isBtcPriceLoading, error: btcPriceError } = useProfessionalBTCPrice();
  
  const { supportedGPUs } = useBitLeaseGPU();
  const { price: selectedGPUPrice, isLoading: isPriceLoading } = useBitLeaseGPUPrice(selectedGPU);
  const { createLease, isCreatingLease: isTransactionPending, isConfirming: isLeaseConfirming, isSuccess: isLeaseSuccess, hash: leaseHash } = useBitLeaseLeases();
  const { bbtcBalance: stakingBalance } = useBitLeaseStaking();
  const { borrow, repay, approveBBTC, bbtcAllowance, userBBTCBalance, poolUSDCBalance, btcPrice: oracleBtcPrice, btcPriceUSD, lastUpdated, isOracleStale, oracleSourceCount, isPending: isBorrowPending, isConfirming: isBorrowConfirming, isSuccess: isBorrowSuccess, error, hash: borrowHash, userDebt, userCollateral } = useBitLeaseLending();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveGPU(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const gpuOptions = [
    {
      name: "A100",
      description: "Best for large language models and deep learning",
      specs: ["80GB HBM2e", "6912 CUDA Cores", "312 GB/s Memory Bandwidth"],
      popular: true,
      icon: "🔥",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "H100",
      description: "Latest GPU for maximum AI performance", 
      specs: ["80GB HBM3", "16896 CUDA Cores", "3.35 TB/s Memory Bandwidth"],
      popular: false,
      icon: "🚀",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "V100",
      description: "Great for AI training and scientific computing",
      specs: ["32GB HBM2", "5120 CUDA Cores", "900 GB/s Memory Bandwidth"],
      popular: false,
      icon: "⚡",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "RTX4090",
      description: "High-performance gaming and AI GPU",
      specs: ["24GB GDDR6X", "16384 CUDA Cores", "1008 GB/s Memory Bandwidth"],
      popular: false,
      icon: "🎯",
      color: "from-green-500 to-teal-500"
    }
  ];

  const handleCreateLease = async () => {
    if (!selectedGPU || !leaseHours || !address || !bbtcBalance) return;
    
    try {
      setIsCreatingLease(true);
      const bbtcAmount = bbtcBalance.value; // Use all available bBTC as collateral
      const hours = BigInt(leaseHours);
      
      createLease(bbtcAmount, selectedGPU, hours);
    } catch (error) {
      console.error('Lease creation failed:', error);
    } finally {
      setIsCreatingLease(false);
    }
  };

  const selectedPrice = selectedGPUPrice;
  const totalCost = (parseFloat(selectedPrice) * parseFloat(leaseHours || '0')).toFixed(2);
  const platformFee = (parseFloat(totalCost) * 0.025).toFixed(2); // 2.5% fee
  const totalWithFee = (parseFloat(totalCost) + parseFloat(platformFee)).toFixed(2);

  const availableBBTC = bbtcBalance ? parseFloat((Number(bbtcBalance.value) / 1e8).toFixed(8)) : 0;
  const requiredCollateral = parseFloat(totalWithFee) * 2; // 50% LTV = 2x collateral needed

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden flex items-center justify-center">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative max-w-md w-full mx-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CpuChipIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed font-light">
              Please connect your wallet to start leasing GPUs with Bitcoin collateral.
            </p>
            <div className="text-sm text-blue-300 bg-blue-500/20 rounded-xl p-4">
              Use the "Connect Wallet" button in the top right corner.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-ping" style={{animationDuration: '8s'}} />
      </div>
      
      {/* Header */}
      <section className="relative pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transition-all duration-2000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-400/20 to-red-400/20 backdrop-blur-xl border border-orange-400/30 rounded-full px-6 py-3 mb-8">
              <div className="relative">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-orange-300 font-semibold text-sm">Steps 2-3: Borrow USDC → Lease GPUs</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              Bitcoin-Backed
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  GPU Leasing
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-pink-400/20 blur-xl -z-10 rounded-lg"></div>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Use your Bitcoin as collateral to lease enterprise GPUs for AI training
            </p>
            
            {/* Enhanced Progress Steps */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8">
                <div className="flex justify-center items-center space-x-8">
                  <Link href="/stake" className="group flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30 transform group-hover:scale-110 transition-all duration-300">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                    <span className="text-green-300 font-semibold">1. Stake WBTC</span>
                  </Link>
                  
                  <div className="flex-1 h-1 bg-gradient-to-r from-green-500 via-orange-500 to-orange-500 rounded-full max-w-24"></div>
                  
                  <button
                    onClick={() => setCurrentStep('borrow')}
                    className={`group flex flex-col items-center transition-all duration-300 ${currentStep === 'borrow' ? 'scale-110' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform group-hover:scale-110 transition-all duration-300 ${
                      currentStep === 'borrow' ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30' : 'bg-slate-600'
                    }`}>
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <span className={`font-semibold ${currentStep === 'borrow' ? 'text-orange-400' : 'text-gray-400'}`}>
                      2. Borrow USDC
                    </span>
                  </button>
                  
                  <div className="flex-1 h-1 bg-gradient-to-r from-orange-500 to-gray-600 rounded-full max-w-24"></div>
                  
                  <button
                    onClick={() => setCurrentStep('lease')}
                    className={`group flex flex-col items-center transition-all duration-300 ${currentStep === 'lease' ? 'scale-110' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform group-hover:scale-110 transition-all duration-300 ${
                      currentStep === 'lease' ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30' : 'bg-slate-600'
                    }`}>
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <span className={`font-semibold ${currentStep === 'lease' ? 'text-orange-400' : 'text-gray-400'}`}>
                      3. Lease GPUs
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Professional Live BTC Price */}
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-blue-300 font-semibold">Live BTC Price:</span>
                  <span className="text-white font-bold text-xl">
                    {isBtcPriceLoading ? 'Loading...' : realBtcPrice ? `$${realBtcPrice.toLocaleString()}` : 'Error'}
                  </span>
                </div>
                
                {/* Live Price Status */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-400">Price Feed:</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isBtcPriceLoading 
                        ? 'bg-yellow-400 animate-pulse'
                        : realBtcPrice 
                          ? 'bg-green-400'
                          : 'bg-red-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      isBtcPriceLoading 
                        ? 'text-yellow-400'
                        : realBtcPrice 
                          ? 'text-green-400' 
                          : 'text-red-400'
                    }`}>
                      {isBtcPriceLoading ? 'Updating' : realBtcPrice ? 'Live' : 'Error'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  Source: CoinGecko API • Updates every 30s
                </div>
                
                {btcPriceError && (
                  <div className="text-xs text-orange-300 bg-orange-500/20 rounded-lg p-2">
                    {btcPriceError} - Using fallback data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative pb-24">
        {/* Step-based Content */}
        {currentStep === 'borrow' ? (
          /* STEP 2: BORROW USDC INTERFACE */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Step 2: Borrow USDC with 
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> bBTC Collateral</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                Use your bBTC tokens as collateral to borrow USDC for GPU leasing
              </p>
              
              {/* Enhanced Information Cards */}
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <InformationCircleIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-blue-300 font-bold text-xl mb-4">How bBTC Works & Yield Generation</h3>
                        <div className="text-sm text-gray-300 space-y-2 leading-relaxed">
                          <p>• <strong className="text-white">bBTC</strong> represents your staked Bitcoin earning <strong className="text-orange-400">5.5% APY</strong> through CoreDAO's Bitcoin staking</p>
                          <p>• <strong className="text-white">Loan-to-Value:</strong> You can borrow up to 50% of your bBTC value in USDC</p>
                          <p>• <strong className="text-white">To recover bBTC:</strong> Simply repay your USDC debt (plus any accrued interest)</p>
                          <p>• <strong className="text-white">Your bBTC keeps earning 5.5% yield</strong> even while used as collateral</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-green-500/50 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <CheckCircleIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-green-300 font-bold text-xl mb-4">Complete User Journey</h3>
                        <div className="text-sm text-gray-300 space-y-2 leading-relaxed">
                          <p>1. <strong className="text-white">Borrow USDC</strong> using bBTC as collateral (up to 50% LTV)</p>
                          <p>2. <strong className="text-white">Lease GPUs</strong> with borrowed USDC and earn from AI/ML training</p>
                          <p>3. <strong className="text-white">Repay USDC debt</strong> (with interest) to unlock your bBTC collateral</p>
                          <p>4. <strong className="text-white">Withdraw bBTC → WBTC:</strong> Convert bBTC back to WBTC anytime</p>
                          <p>5. <strong className="text-orange-400">Keep earning 5.5% yield</strong> throughout the entire process!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`grid lg:grid-cols-2 gap-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>
              {/* Enhanced Borrowing Interface */}
              <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <CreditCardIcon className="h-7 w-7 text-white" />
                    </div>
                    Borrow USDC
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Enhanced Collateral Amount */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-lg font-semibold text-gray-300">bBTC Collateral Amount</label>
                        <span className="text-sm text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">
                          Available: {(Number(userBBTCBalance || 0n) / 1e8).toFixed(8)} bBTC
                        </span>
                      </div>
                      <div className="flex space-x-4">
                        <Input
                          type="number"
                          placeholder="0.001"
                          value={borrowAmount}
                          onChange={(e) => {
                            setBorrowAmount(e.target.value);
                          }}
                          className="flex-1 text-xl font-semibold bg-slate-700/50 border-slate-600 text-white py-4 rounded-xl"
                          step="0.00000001"
                        />
                        <Button
                          onClick={() => setBorrowAmount((Number(userBBTCBalance || 0n) / 1e8).toString())}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    {/* Professional Max USDC Calculation */}
                    {borrowAmount && parseFloat(borrowAmount) > 0 && (
                      <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                        <div className="text-center">
                          <div className="text-blue-300 font-semibold mb-2">Max USDC you can borrow (50% LTV):</div>
                          {realBtcPrice && !isBtcPriceLoading ? (
                            <>
                              <div className="text-3xl font-black text-blue-200 mb-2">
                                ${((parseFloat(borrowAmount) * realBtcPrice) * 0.5).toFixed(2)} USDC
                              </div>
                              <div className="text-blue-300 text-sm">
                                Based on live BTC price: ${realBtcPrice.toLocaleString()}
                              </div>
                            </>
                          ) : isBtcPriceLoading ? (
                            <>
                              <div className="text-2xl font-black text-yellow-300 mb-2">
                                Loading Price...
                              </div>
                              <div className="text-yellow-200 text-sm">
                                Fetching live BTC price for calculation
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl font-black text-red-300 mb-2">
                                Price Unavailable
                              </div>
                              <div className="text-red-200 text-sm">
                                Unable to fetch BTC price - please check your connection
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="space-y-4">
                      {/* Approval Check */}
                      {borrowAmount && Number(bbtcAllowance || 0n) < parseUnits(borrowAmount, 8) ? (
                        <Button
                          onClick={() => approveBBTC(parseUnits('1000', 8))}
                          disabled={isBorrowPending}
                          className="group relative w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-2xl text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {isBorrowPending ? 'Approving...' : 'Approve bBTC Collateral'}
                            {!isBorrowPending && <ArrowRightIcon className="h-5 w-5 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />}
                          </span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            console.log('Borrow button clicked:', {
                              borrowAmount,
                              realBtcPrice,
                              isBtcPriceLoading,
                              hasValidInputs: borrowAmount && realBtcPrice && realBtcPrice > 0
                            });
                            
                            if (borrowAmount && realBtcPrice && realBtcPrice > 0) {
                              const collateralAmount = parseUnits(borrowAmount, 8);
                              // Calculate max USDC based on 50% LTV using live BTC price
                              const maxUsdcValue = (parseFloat(borrowAmount) * realBtcPrice) * 0.5;
                              // For testnet, try a smaller amount if the full amount is too large
                              const testnetMaxUSDC = Math.min(maxUsdcValue, 1000); // Cap at $1000 for testnet
                              const borrowUsdcAmount = parseUnits(testnetMaxUSDC.toFixed(6), 6);
                              console.log('Calling borrow with:', {
                                collateralAmount: collateralAmount.toString(),
                                borrowUsdcAmount: borrowUsdcAmount.toString(),
                                maxUsdcValue,
                                testnetMaxUSDC
                              });
                              borrow(collateralAmount, borrowUsdcAmount);
                            } else {
                              console.log('Borrow conditions not met:', {
                                hasBorrowAmount: !!borrowAmount,
                                hasRealBtcPrice: !!realBtcPrice,
                                isBtcPriceValid: realBtcPrice > 0
                              });
                            }
                          }}
                          disabled={isBorrowPending || isBorrowConfirming || !borrowAmount || parseFloat(borrowAmount) <= 0 || !realBtcPrice || isBtcPriceLoading}
                          className="group relative w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-2xl text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {isBorrowConfirming 
                              ? 'Borrowing...' 
                              : isBtcPriceLoading
                                ? 'Loading BTC Price...'
                                : !realBtcPrice
                                  ? 'BTC Price Unavailable'
                                  : 'Borrow Max USDC Against bBTC'
                            }
                            {!isBorrowConfirming && realBtcPrice && !isBtcPriceLoading && <ArrowRightIcon className="h-5 w-5 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />}
                          </span>
                        </Button>
                      )}

                      {/* Borrow Success Message */}
                      {isBorrowSuccess && borrowHash && (
                        <div className="mt-6 p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-2xl">
                          <div className="flex items-center justify-center mb-4">
                            <CheckCircleIcon className="h-8 w-8 text-green-400 mr-3" />
                            <span className="text-green-300 font-bold text-xl">Successfully Borrowed USDC!</span>
                          </div>
                          <div className="text-center">
                            <p className="text-green-200 mb-4">Your USDC loan has been processed. Check your wallet balance.</p>
                            <a 
                              href={`https://scan.test2.btcs.network/tx/${borrowHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200"
                            >
                              View Transaction on Explorer
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Position Summary */}
              <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <BoltIcon className="h-7 w-7 text-white" />
                    </div>
                    Your Position
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-2xl border border-blue-500/30">
                        <div className="text-blue-300 text-sm font-semibold mb-2">Collateral</div>
                        <div className="text-white font-bold text-2xl">{userCollateral} bBTC</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-6 rounded-2xl border border-red-500/30">
                        <div className="text-red-300 text-sm font-semibold mb-2">Debt</div>
                        <div className="text-white font-bold text-2xl">{userDebt} USDC</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600/50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-300 font-semibold">Health Factor</span>
                        <span className={`font-bold text-xl ${
                          parseFloat(userDebt) > 0 && parseFloat(userDebt) < 1.5 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          {parseFloat(userDebt) > 0 ? parseFloat(userDebt).toFixed(2) : 'Healthy'}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced WBTC Withdrawal Notice */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <InformationCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-purple-300 font-bold text-lg mb-2">Get Your WBTC Back</h4>
                          <p className="text-gray-300 leading-relaxed">
                            Visit the <Link href="/stake" className="text-purple-400 hover:text-purple-300 underline font-semibold">Stake page</Link> to withdraw your bBTC and convert it back to WBTC anytime.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced REPAY SECTION */}
            {parseFloat(userDebt) > 0 && (
              <div className={`mt-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '700ms' }}>
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-white mb-6">
                    Repay USDC 
                    <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"> Debt</span>
                  </h2>
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                    Repay your USDC loan to unlock your bBTC collateral
                  </p>
                </div>

                <div className="max-w-3xl mx-auto">
                  <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-green-500/50 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                          <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                        Debt Repayment
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Enhanced Current Debt Display */}
                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-6">
                          <div className="text-center">
                            <div className="text-red-300 text-lg font-semibold mb-2">Outstanding USDC Debt:</div>
                            <div className="text-white font-black text-3xl mb-2">
                              ${userDebt} USDC
                            </div>
                            <div className="text-red-200">
                              Interest accrues at 8% APR
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Available USDC for Repayment */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6">
                          <div className="text-center">
                            <div className="text-blue-300 text-lg font-semibold mb-2">Available USDC in Wallet:</div>
                            <div className="text-white font-black text-3xl">
                              ${usdcBalance ? (Number(usdcBalance.value) / 1e6).toFixed(2) : '0.00'} USDC
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Repay Actions */}
                        <div className="space-y-6">
                          <Button
                            onClick={() => {
                              if (userDebt && parseFloat(userDebt) > 0 && userCollateral) {
                                // Repay the full debt amount and withdraw all collateral
                                const repayAmount = parseUnits(userDebt, 6);
                                const withdrawCollateral = parseUnits(userCollateral, 8);
                                repay(repayAmount, withdrawCollateral);
                              }
                            }}
                            disabled={isBorrowPending || isBorrowConfirming || parseFloat(userDebt) <= 0 || !usdcBalance || Number(usdcBalance.value) < Number(parseUnits(userDebt, 6))}
                            className="group relative w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-6 rounded-2xl text-xl font-bold shadow-2xl shadow-green-500/30 transform hover:scale-105 transition-all duration-300 overflow-hidden"
                          >
                            <span className="relative z-10 flex items-center justify-center">
                              {isBorrowConfirming ? 'Repaying...' : `Repay Full Debt (${userDebt} USDC)`}
                              {!isBorrowConfirming && <ArrowRightIcon className="h-6 w-6 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-green-500 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                          </Button>

                          {/* Enhanced Post-Repayment Instructions */}
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <InformationCircleIcon className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <h4 className="text-purple-300 font-bold text-xl mb-3">After Repayment</h4>
                                <p className="text-gray-300 leading-relaxed">
                                  Once you repay your USDC debt, your bBTC collateral will be unlocked. 
                                  You can then visit the <Link href="/stake" className="text-purple-400 hover:text-purple-300 underline font-semibold">Stake page</Link> to withdraw your bBTC and convert it back to WBTC.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STEP 3: LEASE GPU INTERFACE */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Step 3: Lease GPUs with 
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> USDC</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                Use your borrowed USDC to pay for enterprise GPU compute
              </p>
              
              {/* Enhanced Testnet Notice */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-3xl p-8">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <InformationCircleIcon className="h-9 w-9 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-orange-300 font-bold text-2xl mb-4">Testnet Information & Business Model</h3>
                      <div className="text-gray-300 space-y-2 leading-relaxed">
                        <p>• <strong className="text-white">GPU Prices:</strong> Currently showing static/mock prices for testing purposes</p>
                        <p>• <strong className="text-white">BitLease Revenue:</strong> 2.5% platform fee on all GPU leases</p>
                        <p>• <strong className="text-white">Testnet Mode:</strong> GPU leasing disabled - only borrowing/repaying works</p>
                        <p>• <strong className="text-white">Mainnet:</strong> Will connect to live GPU marketplaces like Vast.ai for real pricing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              
            {/* Enhanced USDC Balance Display */}
            <div className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>
              <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-3xl p-8 text-center">
                <div className="text-green-300 text-lg font-semibold mb-3">Available USDC for GPU Leasing</div>
                <div className="text-4xl font-black text-green-200 mb-3">
                  ${usdcBalance ? (Number(usdcBalance.value) / 1e6).toFixed(2) : '0.00'} USDC
                </div>
                <div className="text-green-400 font-medium">
                  Borrowed from your bBTC collateral
                </div>
              </div>
            </div>
            
            {/* Enhanced GPU Selection */}
            <div className={`mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '700ms' }}>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-white mb-4">Choose Your GPU</h3>
                <p className="text-gray-400 text-lg">Select from our enterprise-grade GPU fleet</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {gpuOptions.map((gpu, index) => {
                  const price = selectedGPU === gpu.name ? selectedGPUPrice : '0.00';
                  const isAvailable = true;
                  const isSelected = selectedGPU === gpu.name;
                  const isActive = activeGPU === index;
              
                  return (
                    <div 
                      key={index} 
                      className={`group relative cursor-pointer transition-all duration-500 overflow-hidden rounded-3xl border transform hover:scale-105 ${
                        isSelected
                          ? `bg-gradient-to-br ${gpu.color}/20 border-orange-500/50 shadow-2xl shadow-orange-500/20 ring-2 ring-orange-500/50 scale-105` 
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-orange-500/30'
                      } ${isActive && !isSelected ? 'ring-2 ring-purple-500/50 bg-purple-500/10' : ''}`}
                      onClick={() => setSelectedGPU(gpu.name)}
                    >
                      {/* Background Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gpu.color} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`}></div>
                      
                      <div className="relative z-10 p-8">
                        {gpu.popular && (
                          <div className="absolute top-6 right-6">
                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              POPULAR
                            </span>
                          </div>
                        )}
                        
                        {/* GPU Icon */}
                        <div className="text-center mb-6">
                          <div className={`w-16 h-16 bg-gradient-to-br ${gpu.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                            <span className="text-3xl">{gpu.icon}</span>
                          </div>
                        </div>
                        
                        <div className="text-center mb-6">
                          <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                            isSelected ? 'text-orange-400' : 'text-white group-hover:text-orange-300'
                          }`}>
                            {gpu.name}
                          </h3>
                          <p className="text-gray-300 leading-relaxed">{gpu.description}</p>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                          {gpu.specs.map((spec, i) => (
                            <div key={i} className="text-sm text-gray-400 flex items-center">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 flex-shrink-0"></span>
                              {spec}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`text-3xl font-black transition-colors duration-300 ${
                            isSelected ? 'text-orange-400' : 'text-white group-hover:text-orange-300'
                          }`}>
                            ${price}/hr
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${
                            isAvailable 
                              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          }`}>
                            {isAvailable ? 'Available' : 'Busy'}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-4 left-4">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Shine Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Lease Configuration - Disabled for Testnet */}
            <div className={`max-w-3xl mx-auto transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '900ms' }}>
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 overflow-hidden opacity-60">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <CpuChipIcon className="h-7 w-7 text-white" />
                    </div>
                    GPU Leasing (Testnet Disabled)
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="lease-hours" className="block text-lg font-semibold text-gray-300 mb-4">
                        Lease Duration (Hours)
                      </label>
                      <Input
                        id="lease-hours"
                        type="number"
                        value={leaseHours}
                        onChange={(e) => setLeaseHours(e.target.value)}
                        className="w-full text-xl font-semibold bg-slate-700/50 border-slate-600 text-white py-4 rounded-xl"
                        min="1"
                        max="168"
                        disabled
                      />
                    </div>

                    <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600/50 space-y-4">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-400 font-medium">GPU Cost:</span>
                        <span className="text-white font-bold">${totalCost}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-400 font-medium">Platform Fee (2.5%):</span>
                        <span className="text-white font-bold">${platformFee}</span>
                      </div>
                      <div className="border-t border-slate-600 pt-4">
                        <div className="flex justify-between text-xl">
                          <span className="text-gray-300 font-bold">Total Cost:</span>
                          <span className="text-white font-black">${totalWithFee}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateLease}
                      disabled={true}
                      className="w-full bg-gray-600 cursor-not-allowed py-6 rounded-2xl text-xl font-bold"
                    >
                      GPU Leasing Disabled in Testnet
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}