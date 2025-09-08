"use client";

import { ReactNode, useEffect, useState } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          {mounted ? children : null}
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}