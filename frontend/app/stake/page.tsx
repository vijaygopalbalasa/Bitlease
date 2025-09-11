"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseUnits } from 'viem';
import { ArrowRightIcon, CheckCircleIcon, InformationCircleIcon, BoltIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useBitLeaseStaking, useWBTCFaucet } from '../../lib/hooks/useBitLease';
import { CONTRACTS } from '../../lib/contracts';
import Link from 'next/link';

export default function StakePage() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [step, setStep] = useState<'approve' | 'stake'>('approve');
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<'approve' | 'stake' | null>(null);
  
  const { address, isConnected } = useAccount();
  const { data: wbtcBalance } = useBalance({
    address,
    token: CONTRACTS.WBTC,
  });
  
  const { 
    bbtcBalance, 
    exchangeRate, 
    allowance,
    deposit, 
    withdraw,
    approveWBTC,
    isDepositing, 
    isConfirming, 
    isSuccess,
    hash
  } = useBitLeaseStaking();

  const {
    claimWBTC,
    isClaiming,
    isConfirming: isFaucetConfirming,
    isSuccess: isFaucetSuccess
  } = useWBTCFaucet();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (!stakeAmount || !address) return;
    
    try {
      setIsStaking(true);
      setLastTransaction('approve');
      const amount = parseUnits(stakeAmount, 8); // WBTC has 8 decimals
      approveWBTC(amount);
    } catch (error) {
      // Error will be handled by wagmi
    } finally {
      setIsStaking(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || !address) return;
    
    try {
      setIsStaking(true);
      setLastTransaction('stake');
      const amount = parseUnits(stakeAmount, 8); // WBTC has 8 decimals
      deposit(amount);
    } catch (error) {
      // Error will be handled by wagmi
    } finally {
      setIsStaking(false);
    }
  };

  // Check allowance to determine if we need approval
  useEffect(() => {
    if (stakeAmount && allowance) {
      const amount = parseUnits(stakeAmount, 8);
      if (allowance >= amount) {
        setStep('stake');
        setIsApproved(true);
      } else {
        setStep('approve');
        setIsApproved(false);
      }
    }
  }, [stakeAmount, allowance]);

  // Switch to stake step after successful approval
  useEffect(() => {
    if (isSuccess && step === 'approve' && lastTransaction === 'approve') {
      // Small delay to allow blockchain state to update
      const timer = setTimeout(() => {
        setStep('stake');
        setIsApproved(true);
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [isSuccess, step, lastTransaction]);

  const maxStake = wbtcBalance ? Number(wbtcBalance.value) / 1e8 : 0;

  const stakingSteps = [
    {
      title: "Bitcoin Timelock Staking",
      description: "Your WBTC represents Bitcoin locked using CLTV timelock on Bitcoin network",
      icon: "🔒",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Earn CORE Token Rewards", 
      description: "Participate in Core's consensus by voting for validators. Earn CORE rewards when elected validators produce blocks",
      icon: "🏆",
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Get Liquid bBTC Tokens",
      description: "Receive yield-bearing receipt tokens that accumulate value from distributed CORE rewards",
      icon: "💰",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Use as Collateral",
      description: "Use bBTC to lease GPUs while still earning staking rewards",
      icon: "🚀",
      color: "from-green-500 to-teal-500"
    }
  ];

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
              <span className="text-white font-bold text-2xl">₿</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed font-light">
              Please connect your wallet to start staking Bitcoin and earning yield.
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
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-400/20 to-purple-400/20 backdrop-blur-xl border border-blue-400/30 rounded-full px-6 py-3 mb-8">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-blue-300 font-semibold text-sm">Step 1 of 2: Stake Bitcoin First</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              Stake Bitcoin, Earn
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  CORE Rewards
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-pink-400/20 blur-xl -z-10 rounded-lg"></div>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Lock your Bitcoin using Core DAO's non-custodial dual staking mechanism to earn 
              <span className="text-orange-400 font-semibold"> 5.5% APY</span> while getting liquid bBTC tokens
            </p>

            {/* Progress Indicator */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Your Bitcoin Journey</h3>
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg shadow-blue-500/30">
                      1
                    </div>
                    <div className="text-blue-300 font-semibold text-center">
                      Stake Bitcoin
                      <div className="text-orange-400 text-sm">← You Are Here</div>
                    </div>
                  </div>
                  <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 to-gray-600 rounded-full max-w-32"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-lg mb-3">
                      2
                    </div>
                    <div className="text-gray-400 font-semibold text-center">
                      Lease GPUs
                      <div className="text-gray-500 text-sm">Next Step</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Left Column - Staking Interface */}
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
            <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-bold">₿</span>
                  </div>
                  Stake Your Bitcoin
                </h2>
                
                {/* Enhanced Balance Display */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-blue-300 font-semibold">Available to Stake</span>
                    <span className="text-purple-300 font-semibold">bBTC Balance</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-bold text-xl">
                      {wbtcBalance ? `${(Number(wbtcBalance.value) / 1e8).toFixed(4)} WBTC` : '0.0000 WBTC'}
                    </span>
                    <span className="text-white font-bold text-xl">
                      {bbtcBalance} bBTC
                    </span>
                  </div>
                  
                  {/* Enhanced Faucet Button */}
                  {maxStake === 0 && (
                    <div className="border-t border-blue-500/30 pt-4">
                      <div className="text-sm text-blue-300 mb-3 font-medium">Need testnet WBTC tokens?</div>
                      <Button
                        onClick={claimWBTC}
                        disabled={isClaiming || isFaucetConfirming}
                        className="group w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        {isClaiming || isFaucetConfirming ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isClaiming ? 'Getting WBTC...' : 'Confirming...'}
                          </div>
                        ) : (
                          <span className="relative z-10 flex items-center justify-center">
                            🪙 Get 10 Test WBTC
                          </span>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Enhanced Success message for faucet */}
                  {isFaucetSuccess && (
                    <div className="border-t border-green-500/30 pt-4 mt-4">
                      <div className="flex items-center p-4 bg-green-500/20 rounded-2xl border border-green-500/30">
                        <CheckCircleIcon className="h-6 w-6 text-green-400 mr-3" />
                        <span className="text-green-300 font-semibold">
                          Successfully received 10 WBTC! Refresh to see updated balance.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Staking Form */}
                <div className="space-y-8">
                  <div>
                    <label htmlFor="stake-amount" className="block text-lg font-semibold text-gray-300 mb-4">
                      Amount to Stake (WBTC)
                    </label>
                    <div className="relative">
                      <Input
                        id="stake-amount"
                        type="number"
                        step="0.00000001"
                        max={maxStake}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00000000"
                        className="text-xl font-semibold bg-slate-700/50 border-slate-600 text-white pr-20 py-4 rounded-xl"
                      />
                      <button
                        onClick={() => setStakeAmount(maxStake.toFixed(8))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 font-semibold hover:text-blue-300 bg-blue-500/20 px-3 py-1 rounded-lg transition-colors duration-200"
                      >
                        MAX
                      </button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="text-gray-400 font-medium">
                        Exchange Rate: 1 WBTC = {exchangeRate} bBTC
                      </div>
                      {stakeAmount && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">Allowance Status:</span>
                          {allowance >= parseUnits(stakeAmount, 8) ? (
                            <span className="text-green-400 text-sm font-semibold flex items-center">
                              ✓ Approved
                            </span>
                          ) : (
                            <span className="text-orange-400 text-sm font-semibold flex items-center">
                              ⚠ Approval Required
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Exchange Rate Explanation */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6 mt-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <InformationCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-blue-300 font-bold text-lg mb-3">Why You Get More bBTC?</h4>
                          <div className="text-sm text-gray-300 space-y-2 leading-relaxed">
                            <p>• <strong className="text-white">bBTC accumulates value</strong> from CORE token rewards earned by all stakers</p>
                            <p>• <strong className="text-white">Exchange rate grows over time</strong> as more CORE rewards are distributed to the vault</p>
                            <p>• <strong className="text-white">You get slightly more bBTC tokens</strong> to represent your share of accumulated rewards</p>
                            <p>• <strong className="text-white">Real yield:</strong> CORE tokens earned through Core DAO's dual staking mechanism</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Expected Output */}
                  {stakeAmount && (
                    <div className="p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl border border-green-500/30">
                      <div className="text-center">
                        <div className="text-green-300 font-semibold mb-2">You will receive:</div>
                        <div className="text-3xl font-black text-green-200 mb-2">
                          ≈ {(parseFloat(stakeAmount || '0') * parseFloat(exchangeRate)).toFixed(8)} bBTC
                        </div>
                        <div className="text-green-400 text-sm">
                          Worth ${(parseFloat(stakeAmount || '0') * 60000).toLocaleString()} at current BTC price
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={step === 'approve' ? handleApprove : handleStake}
                    disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > maxStake || isDepositing || isConfirming}
                    className="group relative w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white py-6 rounded-2xl text-xl font-bold shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-all duration-500 overflow-hidden"
                  >
                    {isDepositing || isConfirming ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {step === 'approve' ? 'Approving...' : isDepositing ? 'Staking...' : 'Confirming...'}
                      </div>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center">
                        {step === 'approve' ? 'Approve WBTC' : 'Stake Bitcoin'}
                        <ArrowRightIcon className="h-6 w-6 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 delay-200"></div>
                  </Button>

                  {/* Enhanced Success Message - Only for Staking */}
                  {isSuccess && hash && lastTransaction === 'stake' && (
                    <div className="p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-2xl">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-green-300 font-bold text-lg">Successfully staked!</span>
                      </div>
                      <p className="text-green-200 mb-4">Your bBTC is now earning CORE token rewards through dual staking.</p>
                      <a 
                        href={`https://scan.test2.btcs.network/tx/${hash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                      >
                        🔗 View transaction on CoreScan
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </a>
                    </div>
                  )}

                  {/* Approval Success Message */}
                  {isSuccess && hash && lastTransaction === 'approve' && (
                    <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-blue-300 font-bold text-lg">WBTC Approved!</span>
                      </div>
                      <p className="text-blue-200 mb-4">You can now stake your WBTC to earn CORE rewards.</p>
                      <a 
                        href={`https://scan.test2.btcs.network/tx/${hash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                      >
                        🔗 View approval transaction on CoreScan
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Next Step */}
            {parseFloat(bbtcBalance) > 0 && (
              <div className="group relative bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-8 mt-8 hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-white font-bold text-xl">🚀</span>
                    </div>
                    <h3 className="text-2xl font-bold text-orange-300">Ready for Step 2!</h3>
                  </div>
                  <p className="text-orange-200 text-lg mb-6 leading-relaxed">
                    You now have bBTC tokens. Use them as collateral to lease GPUs instantly.
                  </p>
                  <Link href="/lease">
                    <Button className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                      <span className="relative z-10 flex items-center">
                        Lease GPUs Now
                        <ArrowRightIcon className="h-5 w-5 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Enhanced Withdrawal Interface */}
            {parseFloat(bbtcBalance) > 0 && (
              <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mt-8 hover:border-purple-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-white" />
                    </div>
                    Withdraw bBTC → WBTC
                  </h2>
                  
                  <div className="mb-6 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-purple-300 font-semibold">Available to Withdraw</span>
                      <span className="text-pink-300 font-semibold">Exchange Rate</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-xl">{bbtcBalance} bBTC</span>
                      <span className="text-white font-bold text-xl">1 bBTC = {(parseFloat(exchangeRate)).toFixed(4)} WBTC</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-300 mb-4">
                        bBTC Amount to Withdraw
                      </label>
                      <div className="flex space-x-4">
                        <Input
                          type="number"
                          placeholder="0.001"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="flex-1 text-xl font-semibold bg-slate-700/50 border-slate-600 text-white py-4 rounded-xl"
                          max={parseFloat(bbtcBalance)}
                          step="0.00000001"
                        />
                        <Button
                          onClick={() => setStakeAmount(bbtcBalance)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600/50">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-400 font-medium">You'll receive:</span>
                        <span className="text-white font-bold">
                          {stakeAmount ? (parseFloat(stakeAmount) * parseFloat(exchangeRate)).toFixed(8) : '0.00000000'} WBTC
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        if (stakeAmount) {
                          const amount = parseUnits(stakeAmount, 8); // Reverted: bBTC uses 8 decimals like WBTC
                          withdraw(amount);
                        }
                      }}
                      disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(bbtcBalance) || isDepositing || isConfirming}
                      className="group relative w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-2xl text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden"
                    >
                      {isDepositing || isConfirming ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Withdrawing...
                        </div>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center">
                          Withdraw to WBTC
                          <ArrowRightIcon className="h-5 w-5 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />
                        </span>
                      )}
                    </Button>

                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <InformationCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-orange-300 font-bold text-lg mb-2">Withdrawal Process</h4>
                          <p className="text-orange-200 leading-relaxed">
                            Convert your bBTC back to WBTC anytime. Your staking rewards will stop accruing after withdrawal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Benefits & Info */}
          <div className={`space-y-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>

            {/* Enhanced Key Features */}
            <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <ShieldCheckIcon className="h-10 w-10 mr-4 text-purple-400" />
                  Why Stake Bitcoin on Core?
                </h3>
                
                <div className="grid gap-6">
                  {[
                    { icon: "⚡", title: "5.5% APY", desc: "Earn CORE tokens through validator rewards", color: "from-orange-500 to-red-500" },
                    { icon: "💧", title: "Liquid Staking", desc: "Get bBTC tokens to use in DeFi while earning yield", color: "from-blue-500 to-purple-500" },
                    { icon: "🛡️", title: "Non-Custodial", desc: "Your Bitcoin stays secure using CLTV timelocks", color: "from-green-500 to-teal-500" },
                    { icon: "🖥️", title: "GPU Collateral", desc: "Use bBTC to lease enterprise compute power", color: "from-purple-500 to-pink-500" }
                  ].map((benefit, index) => (
                    <div key={index} className="group/benefit bg-slate-700/40 hover:bg-slate-600/60 rounded-2xl p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 border border-slate-600/50 hover:border-purple-500/50">
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center shadow-lg group-hover/benefit:scale-110 group-hover/benefit:rotate-12 transition-all duration-300 flex-shrink-0`}>
                          <span className="text-2xl">{benefit.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-xl mb-3 group-hover/benefit:text-purple-300 transition-colors duration-300">{benefit.title}</h4>
                          <p className="text-gray-300 leading-relaxed group-hover/benefit:text-white transition-colors duration-300">{benefit.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Core DAO Summary */}
                <div className="mt-8 bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white font-bold text-xl">₿</span>
                    </div>
                    <div>
                      <h4 className="text-orange-300 font-bold text-xl mb-3">Dual Staking Mechanism</h4>
                      <p className="text-gray-300 leading-relaxed">
                        <strong className="text-white">Core DAO's dual staking</strong> combines Bitcoin's security with validator rewards. 
                        Your Bitcoin earns <strong className="text-orange-400">CORE tokens</strong> when elected validators produce blocks, 
                        creating real yield from network participation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Testnet Notice */}
            <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <InformationCircleIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-300 text-xl mb-3">Testnet Notice</h4>
                    <p className="text-blue-200 leading-relaxed mb-4">
                      This is running on Core DAO testnet. Use testnet tokens only. Get testnet CORE from the faucet.
                    </p>
                    <a 
                      href="https://scan.test2.btcs.network/faucet" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Get Testnet CORE
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}