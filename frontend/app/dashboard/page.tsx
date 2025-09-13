"use client";

import { useState, useEffect } from 'react';
import { CpuChipIcon, CurrencyDollarIcon, ClockIcon, ChartBarIcon, PlusIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Link from 'next/link';
import { useBitLeaseStaking, useBitLeaseLending } from '../../lib/hooks/useBitLease';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '../../lib/contracts';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Get real blockchain data
  const { address } = useAccount();
  const { bbtcBalance, exchangeRate } = useBitLeaseStaking();
  const { userCollateral, userDebt, poolUSDCBalance } = useBitLeaseLending();
  
  // Get user's USDC balance separately (not included in lending hook)
  const { data: userUSDCBalance } = useReadContract({
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
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setAnimatedValue(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Real data from blockchain contracts
  const userStats = {
    totalBTCStaked: userCollateral ? parseFloat(userCollateral) : 0,
    bBTCBalance: bbtcBalance ? parseFloat(bbtcBalance) : 0,
    activeLeases: 2, // Keep mock for demo
    totalSpent: userDebt ? parseFloat(userDebt) : 0,
    usdcBalance: userUSDCBalance ? parseFloat(formatUnits(userUSDCBalance, 6)) : 0,
    earned: 15.75 // Keep mock APY calculation for demo
  };

  const activeLeases = [
    {
      id: 1,
      gpu: "A100 80GB",
      duration: "24h",
      remaining: "14h 23m",
      cost: "$60.00",
      status: "active",
      ip: "192.168.1.100"
    },
    {
      id: 2,
      gpu: "V100 32GB", 
      duration: "12h",
      remaining: "2h 15m",
      cost: "$21.60",
      status: "active",
      ip: "192.168.1.101"
    }
  ];

  const recentActivity = [
    { type: 'lease_started', gpu: 'A100 80GB', amount: '$60.00', time: '2 hours ago' },
    { type: 'repayment', amount: '$43.20', time: '1 day ago' },
    { type: 'lease_started', gpu: 'V100 32GB', amount: '$21.60', time: '2 days ago' },
    { type: 'stake', amount: '0.1 BTC', time: '1 week ago' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'leases', name: 'Active Leases', icon: CpuChipIcon },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ];

  const statsCards = [
    {
      label: "BTC Collateral",
      value: userStats.totalBTCStaked.toFixed(8),
      subtitle: "Locked as collateral",
      icon: "₿",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-400"
    },
    {
      label: "bBTC Balance", 
      value: userStats.bBTCBalance.toFixed(8),
      subtitle: "Available liquid tokens",
      icon: CurrencyDollarIcon,
      color: "from-blue-500 to-purple-500",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-400"
    },
    {
      label: "USDC Debt",
      value: `$${userStats.totalSpent.toFixed(2)}`,
      subtitle: "Current borrowed amount",
      icon: ChartBarIcon,
      color: "from-red-500 to-pink-500", 
      bgColor: "bg-red-500/20",
      textColor: "text-red-400"
    },
    {
      label: "USDC Balance",
      value: `$${userStats.usdcBalance.toFixed(2)}`,
      subtitle: "Available for repayment",
      icon: CurrencyDollarIcon,
      color: "from-green-500 to-teal-500",
      bgColor: "bg-green-500/20", 
      textColor: "text-green-400"
    }
  ];

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
          <div className={`transition-all duration-2000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12">
              <div>
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-xl border border-green-400/30 rounded-full px-6 py-3 mb-6">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-green-300 font-semibold text-sm">BitLease Dashboard</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                  Portfolio 
                  <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl font-light">
                  Manage your Bitcoin staking positions and GPU lease portfolio
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8 lg:mt-0">
                <Link href="/stake">
                  <Button className="group relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-500/30 transform hover:scale-110 transition-all duration-500 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <PlusIcon className="h-5 w-5 mr-2 transform group-hover:rotate-90 transition-transform duration-300" />
                      Stake BTC
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  </Button>
                </Link>
                
                <Link href="/lease">
                  <Button className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl shadow-orange-500/30 transform hover:scale-110 transition-all duration-500 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <CpuChipIcon className="h-5 w-5 mr-2 transform group-hover:scale-110 transition-transform duration-300" />
                      Lease GPU
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* New User Onboarding */}
        {!address ? (
          <div className={`max-w-4xl mx-auto mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  🔗 Connect Your Wallet
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto font-light">
                  Connect your wallet to view your real BitLease portfolio data and start Bitcoin-backed GPU leasing.
                </p>
              </div>
            </div>
          </div>
        ) : userStats.totalBTCStaked === 0 && userStats.bBTCBalance === 0 && (
          <div className={`max-w-4xl mx-auto mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '300ms' }}>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl opacity-50 animate-pulse"></div>
              <div className="absolute inset-px bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl"></div>
              
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  🚀 Welcome to BitLease!
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto font-light">
                  Get started with Bitcoin-backed GPU leasing in 2 simple steps. First stake your Bitcoin to earn 5.5% APY, then use your bBTC tokens to lease enterprise GPUs.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto shadow-lg shadow-blue-500/30">
                        1
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Stake Bitcoin</h3>
                      <p className="text-gray-300 text-lg mb-6 leading-relaxed">Lock your Bitcoin on Core DAO to earn 5.5% APY and receive liquid bBTC tokens</p>
                      <Link href="/stake">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Start Staking Bitcoin
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6 opacity-60">
                    <div className="w-16 h-16 bg-gray-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-gray-300 mb-4">Lease GPUs</h3>
                    <p className="text-gray-400 text-lg mb-6 leading-relaxed">Use your bBTC as collateral to lease A100, H100, and other enterprise GPUs</p>
                    <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed py-3 rounded-xl text-lg font-semibold">
                      Requires bBTC tokens
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '500ms' }}>
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={`group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 overflow-hidden cursor-pointer ${
                animatedValue === index ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : ''
              }`}
            >
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`}></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
                  <p className={`text-3xl font-black mb-1 transition-colors duration-500 ${
                    animatedValue === index ? stat.textColor : 'text-white group-hover:' + stat.textColor
                  }`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs font-semibold ${stat.textColor}`}>{stat.subtitle}</p>
                </div>
                
                <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg`}>
                  {typeof stat.icon === 'string' ? (
                    <span className={`${stat.textColor} text-2xl font-bold`}>{stat.icon}</span>
                  ) : (
                    <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
                  )}
                </div>
              </div>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
              
              {/* Highlight for Current Stat */}
              {animatedValue === index && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-3xl animate-pulse"></div>
              )}
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '700ms' }}>
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center justify-center space-x-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Portfolio Overview */}
              <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                    <ChartBarIcon className="h-7 w-7 mr-3 text-blue-400" />
                    Portfolio Overview
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-6 bg-slate-700/50 rounded-2xl border border-slate-600/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">₿</span>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">BTC Collateral</p>
                          <p className="text-white font-bold text-xl">{userStats.totalBTCStaked.toFixed(8)} BTC</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">Locked</p>
                        <p className="text-gray-300 text-sm">In lending pool</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-6 bg-slate-700/50 rounded-2xl border border-slate-600/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Available bBTC</p>
                          <p className="text-white font-bold text-xl">{userStats.bBTCBalance.toFixed(8)} bBTC</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 font-semibold">Liquid</p>
                        <p className="text-gray-300 text-sm">Ready for staking</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <Link href="/stake">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                        Stake More Bitcoin
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                    <BoltIcon className="h-7 w-7 mr-3 text-orange-400" />
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-6">
                    <Link href="/lease">
                      <div className="group/item flex items-center p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30 hover:bg-orange-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-6 shadow-lg group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300">
                          <CpuChipIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">Lease GPU</p>
                          <p className="text-orange-200">Train AI models with your bBTC</p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link href="/stake">
                      <div className="group/item flex items-center p-6 bg-blue-500/20 rounded-2xl border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-6 shadow-lg group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300">
                          <span className="text-white font-bold text-2xl">₿</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">Stake Bitcoin</p>
                          <p className="text-blue-200">Earn 5.5% APY on your Bitcoin</p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center p-6 bg-purple-500/20 rounded-2xl border border-purple-500/30 opacity-60">
                      <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <ShieldCheckIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg flex items-center">
                          Lease Car 
                          <span className="ml-3 text-xs bg-purple-600 px-3 py-1 rounded-full">Soon</span>
                        </p>
                        <p className="text-purple-200">Phase 3 - Coming Q2 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leases' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <CpuChipIcon className="h-7 w-7 mr-3 text-orange-400" />
                  Active GPU Leases
                </h3>
                <Link href="/lease">
                  <Button className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <PlusIcon className="h-5 w-5 mr-2 transform group-hover:rotate-90 transition-transform duration-300" />
                      New Lease
                    </span>
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6">
                {activeLeases.map((lease, index) => (
                  <div key={lease.id} className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-[1.02] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            <CpuChipIcon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-white">{lease.gpu}</h4>
                            <p className="text-gray-400">Duration: {lease.duration}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                            </div>
                            <span className="text-green-400 font-semibold">Active</span>
                          </div>
                          <p className="text-gray-400">Remaining: {lease.remaining}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-700/50 rounded-2xl border border-slate-600/50">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Cost</p>
                            <p className="text-white font-bold text-xl">{lease.cost}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">IP Address</p>
                            <p className="text-white font-mono">{lease.ip}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4">
                          <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300">
                            SSH Connect
                          </Button>
                          <Button className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300">
                            Extend
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-800/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <ClockIcon className="h-7 w-7 mr-3 text-purple-400" />
                  Recent Activity
                </h3>
                
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-6 bg-slate-700/50 rounded-2xl border border-slate-600/50 hover:bg-slate-600/50 transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="flex items-center space-x-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                          activity.type === 'lease_started' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                          activity.type === 'repayment' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
                          activity.type === 'stake' ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gray-500'
                        }`}>
                          {activity.type === 'lease_started' && <CpuChipIcon className="h-7 w-7 text-white" />}
                          {activity.type === 'repayment' && <CurrencyDollarIcon className="h-7 w-7 text-white" />}
                          {activity.type === 'stake' && <span className="text-white font-bold text-xl">₿</span>}
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">
                            {activity.type === 'lease_started' && `Started ${activity.gpu} lease`}
                            {activity.type === 'repayment' && 'Loan repayment'}
                            {activity.type === 'stake' && 'Bitcoin staked'}
                          </p>
                          <p className="text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">{activity.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}