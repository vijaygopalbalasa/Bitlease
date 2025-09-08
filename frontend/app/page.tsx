"use client";

import { useState, useEffect } from 'react';
import { ArrowRightIcon, CpuChipIcon, BoltIcon, ShieldCheckIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "🔒",
      title: "Stake Bitcoin",
      description: "Lock your BTC on CoreDAO via CLTV timelock. Receive bBTC receipt token that earns 5.5% APY.",
      step: "Step 1",
      gradient: "from-orange-400 via-orange-500 to-red-500",
      glowColor: "shadow-orange-500/30"
    },
    {
      icon: "💳",
      title: "Borrow & Lease",
      description: "Use bBTC as collateral to borrow USDC. Instantly lease GPUs, cars, or solar panels.",
      step: "Step 2", 
      gradient: "from-purple-400 via-purple-500 to-pink-500",
      glowColor: "shadow-purple-500/30"
    },
    {
      icon: "🚀",
      title: "Repay & Unlock",
      description: "After using the service, repay the loan. Your Bitcoin is unlocked with earned rewards.",
      step: "Step 3",
      gradient: "from-blue-400 via-blue-500 to-cyan-500",
      glowColor: "shadow-blue-500/30"
    }
  ];

  const stats = [
    { label: "Market Opportunity", value: "$147M", description: "Bitcoin idle on CoreDAO", color: "text-orange-400" },
    { label: "Target Market", value: "$15B", description: "GPU compute industry", color: "text-purple-400" },
    { label: "Phase 1 Focus", value: "GPU", description: "AI/ML workloads", color: "text-blue-400" },
    { label: "Demo Status", value: "Live", description: "Core mechanics working", color: "text-green-400" }
  ];

  const benefits = [
    {
      icon: CpuChipIcon,
      title: "Cheaper GPU Access",
      value: "$2.50/hr",
      subtitle: "vs $5.00 AWS",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BoltIcon,
      title: "Bitcoin Keeps Earning",
      value: "5.5% APY",
      subtitle: "in CORE tokens",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: ShieldCheckIcon,
      title: "Non-Custodial Security",
      value: "100%",
      subtitle: "Zero custody risk",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: CurrencyDollarIcon,
      title: "No Credit Checks",
      value: "50% LTV",
      subtitle: "Bitcoin collateral",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-ping" style={{animationDuration: '8s'}} />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-1000" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-2000" />
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-500" />
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-green-400 rounded-full animate-bounce delay-1500" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transition-all duration-2000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-xl border border-green-400/30 rounded-full px-6 py-3 mb-8">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-green-300 font-semibold text-sm">Live on CoreDAO Testnet</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              Turn Your Bitcoin Into
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  A Credit Card
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-pink-400/20 blur-xl -z-10 rounded-lg"></div>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Lease GPUs, cars, and solar panels using your Bitcoin as collateral while it keeps earning 
              <span className="text-orange-400 font-semibold"> 5.5% APY</span>. No selling, no taxes, no credit checks.
            </p>
            
            {/* Demo Flow Card */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
                {/* Animated Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl opacity-50 animate-pulse"></div>
                <div className="absolute inset-px bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                    🧪 Interactive Demo Flow
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { 
                        num: "1", 
                        title: "Stake WBTC → Get bBTC", 
                        desc: "Experience Core DAO dual staking with real yield calculation",
                        icon: "₿",
                        color: "from-orange-500 to-red-500"
                      },
                      { 
                        num: "2", 
                        title: "Use bBTC as Collateral", 
                        desc: "Lock bBTC → borrow USDC → see 50% LTV mechanics",
                        icon: "💳",
                        color: "from-purple-500 to-pink-500"
                      },
                      { 
                        num: "3", 
                        title: "Repay & Unlock", 
                        desc: "Complete the credit cycle - bBTC keeps earning yield",
                        icon: "🔓",
                        color: "from-blue-500 to-cyan-500"
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="relative group">
                        <div className={`bg-gradient-to-br ${step.color} p-6 rounded-2xl transform transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1`}>
                          <div className="text-center">
                            <div className="text-3xl mb-3">{step.icon}</div>
                            <h4 className="text-white font-bold text-lg mb-2">{step.title}</h4>
                            <p className="text-white/80 text-sm">{step.desc}</p>
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-gray-900 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                            {step.num}
                          </div>
                        </div>
                        {idx < 2 && (
                          <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-2xl text-gray-400 animate-bounce">
                            →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                    <p className="text-yellow-200 text-sm">
                      <strong>Note:</strong> GPU leasing integration coming soon. Currently showcasing core lending mechanics on testnet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <Link href="/stake">
                <Button className="group relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl shadow-orange-500/30 transform hover:scale-110 transition-all duration-500 overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    🚀 Try Demo: Stake WBTC
                    <ArrowRightIcon className="ml-3 h-6 w-6 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 delay-200"></div>
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="outline" className="group relative border-2 border-slate-600 text-white hover:border-orange-500 px-10 py-5 rounded-2xl text-xl font-bold backdrop-blur-xl transition-all duration-500 transform hover:scale-105 overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    📊 View Dashboard
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="relative py-20 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center group cursor-pointer transform transition-all duration-700 hover:scale-110 ${
                  currentStat === index ? 'scale-105' : ''
                }`}
              >
                <div className={`relative p-6 rounded-2xl ${currentStat === index ? 'bg-gradient-to-br from-orange-500/20 to-purple-500/20 ring-2 ring-orange-500/50' : 'bg-slate-800/30'} transition-all duration-500 hover:bg-gradient-to-br hover:from-slate-700/50 hover:to-slate-600/50`}>
                  <div className={`text-4xl md:text-5xl font-black mb-2 transition-all duration-500 ${
                    currentStat === index ? stat.color : 'text-white group-hover:' + stat.color
                  }`}>
                    {stat.value}
                  </div>
                  <div className="text-orange-300 font-bold text-lg mb-1">{stat.label}</div>
                  <div className="text-gray-400 text-sm">{stat.description}</div>
                  {currentStat === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-2xl animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How BitLease Works Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              How BitLease Works
            </h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto font-light">
              Three simple steps to turn your idle Bitcoin into productive capital
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-full opacity-30"></div>
            
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative text-center transform transition-all duration-700 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 300}ms` }}
              >
                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 overflow-visible group-hover:shadow-2xl group-hover:shadow-orange-500/20">
                  {/* Animated Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl z-0`}></div>
                  
                  {/* Step Number Badge - Higher z-index */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                    <div className={`bg-gradient-to-br ${feature.gradient} px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg ${feature.glowColor} relative z-30`}>
                      {feature.step}
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className="relative z-20 mb-8">
                    <div className={`text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                      {feature.icon}
                    </div>
                    {/* Pulsing Ring */}
                    <div className={`absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-20 animate-ping z-0`}></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-20">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed group-hover:text-white transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Hover Border Effect - Lower z-index */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.gradient} p-0.5`}>
                      <div className="w-full h-full rounded-3xl bg-slate-900/95"></div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow to Next Step */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 text-3xl text-orange-400 animate-bounce z-20">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Why Choose BitLease?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of Bitcoin-backed financial services
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-105 hover:-rotate-1 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`}></div>
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg`}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <div className="text-3xl font-black text-orange-400 mb-1">
                    {benefit.value}
                  </div>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                    {benefit.subtitle}
                  </p>
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-500/20 to-blue-500/20"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Make Your
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Bitcoin Work Harder?
            </span>
          </h2>
          
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
            Join the revolution of Bitcoin-backed asset leasing. Experience the future today on CoreDAO testnet.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8">
            <Link href="/stake">
              <Button className="group relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-2xl shadow-orange-500/30 transform hover:scale-110 transition-all duration-500 overflow-hidden">
                <span className="relative z-10 flex items-center">
                  🚀 Start Your Journey
                  <ArrowRightIcon className="ml-3 h-7 w-7 transform group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 delay-300"></div>
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="group relative border-2 border-slate-600 hover:border-orange-500 text-white px-12 py-6 rounded-2xl text-2xl font-bold backdrop-blur-xl transition-all duration-500 transform hover:scale-105 overflow-hidden">
                <span className="relative z-10 flex items-center">
                  <ChartBarIcon className="mr-3 h-7 w-7" />
                  Dashboard
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">₿</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">BitLease</span>
                  <div className="text-gray-400 text-sm">Bitcoin-backed asset leasing</div>
                </div>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Revolutionizing how Bitcoin holders access real-world assets through innovative collateral mechanisms on CoreDAO.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Protocol</h3>
              <div className="space-y-3">
                <a href="/whitepaper.html" target="_blank" className="block text-gray-400 hover:text-orange-400 transition-colors">Whitepaper</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">GitHub</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Audit Reports</a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Community</h3>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Discord</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Twitter</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Telegram</a>
                <a href="#" className="block text-gray-400 hover:text-orange-400 transition-colors">Medium</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-700/50 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2024 BitLease. Built on CoreDAO. Open source MIT license.
            </div>
            <div className="flex items-center space-x-6">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-semibold">Testnet Live</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}