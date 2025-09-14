"use client";

import { ReactNode, useEffect, useState } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../lib/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes  
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {/* Always render children to prevent layout shifts */}
          <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {children}
          </div>
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}