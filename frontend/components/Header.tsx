"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, BoltIcon, CpuChipIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Declare web components for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'w3m-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard',
    icon: BoltIcon,
    color: 'from-blue-400 to-purple-400'
  },
  { 
    name: 'Stake Bitcoin', 
    href: '/stake',
    icon: CurrencyDollarIcon,
    color: 'from-green-400 to-teal-400'
  },
  { 
    name: 'Lease GPUs', 
    href: '/lease',
    icon: CpuChipIcon,
    color: 'from-orange-400 to-red-400'
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <header className="relative bg-gradient-to-br from-gray-900/95 via-slate-900/90 to-gray-900/95 backdrop-blur-xl border-b border-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 sticky top-0 z-50 overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/10 to-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-10 -left-20 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-blue-400/5 to-purple-500/5 rounded-full blur-3xl animate-ping" style={{animationDuration: '6s'}} />
      </div>

      <nav className={`relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 lg:px-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {/* Enhanced Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="group -m-1.5 p-1.5 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <span className="relative text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-105 transform transition-all duration-300">
              BitLease
            </span>
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-400 group-hover:w-full transition-all duration-500"></div>
          </Link>
        </div>
        
        {/* Mobile Actions - Menu & Wallet */}
        <div className="flex lg:hidden items-center space-x-3">
          {/* Mobile Wallet Connection - Compact */}
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: '200ms' }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur-md"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-0.5 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                {/* @ts-ignore */}
                <w3m-button size="sm" />
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="group -m-2.5 inline-flex items-center justify-center rounded-xl p-3 text-gray-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-orange-500/50 backdrop-blur-xl transition-all duration-300 shadow-lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Enhanced Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-2">
          {navigation.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative px-6 py-3 text-sm font-bold leading-6 text-gray-300 hover:text-white bg-slate-800/30 hover:bg-slate-700/50 rounded-2xl border border-slate-700/50 hover:border-orange-500/50 backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transform hover:scale-105 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-all duration-500`}></div>
                <div className="relative flex items-center space-x-3">
                  <IconComponent className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{item.name}</span>
                </div>
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 -z-10`}></div>
              </Link>
            );
          })}
        </div>
        
        {/* Enhanced Wallet Connection - Desktop Only */}
        <div className={`hidden lg:flex lg:flex-1 lg:justify-end transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: '400ms' }}>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-1 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              {/* @ts-ignore */}
              <w3m-button />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Enhanced Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          {/* Enhanced backdrop */}
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Enhanced mobile menu panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl px-6 py-6 sm:max-w-sm border-l border-slate-700/50 shadow-2xl">
            {/* Enhanced animated background for mobile */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-400/10 to-red-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-purple-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative">
              {/* Enhanced mobile header */}
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="group -m-1.5 p-1.5 relative" onClick={() => setMobileMenuOpen(false)}>
                  <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <span className="relative text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                    BitLease
                  </span>
                </Link>
                
                <button
                  type="button"
                  className="group -m-2.5 rounded-xl p-3 text-gray-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-red-500/50 backdrop-blur-xl transition-all duration-300 shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>
              
              {/* Enhanced mobile navigation */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Navigation</div>
                {navigation.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative block bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-orange-500/50 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transform hover:scale-105`}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-all duration-500`}></div>
                      <div className="relative flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors duration-300">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            {item.name === 'Dashboard' && 'View your portfolio'}
                            {item.name === 'Stake Bitcoin' && 'Earn with Bitcoin'}
                            {item.name === 'Lease GPUs' && 'Access compute power'}
                          </div>
                        </div>
                      </div>
                      <div className={`absolute -inset-1 bg-gradient-to-r ${item.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500 -z-10`}></div>
                    </Link>
                  );
                })}
                
                {/* Enhanced wallet connection for mobile */}
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Wallet</div>
                  <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-4 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-60"></div>
                    <div className="relative">
                      {/* @ts-ignore */}
                      <appkit-button />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}