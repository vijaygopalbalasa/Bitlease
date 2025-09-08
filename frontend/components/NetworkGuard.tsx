"use client";

import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from './ui/Button';

const CORE_TESTNET_CHAIN_ID = 1114;

export function NetworkGuard() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!chain || chain.id === CORE_TESTNET_CHAIN_ID) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mr-4">
      <span className="text-sm font-medium text-red-600 hidden md:inline">Wrong Network</span>
      <Button 
        variant="danger"
        size="sm"
        isLoading={isPending}
        onClick={() => switchChain({ chainId: CORE_TESTNET_CHAIN_ID })}
      >
        Switch Network
      </Button>
    </div>
  );
}
