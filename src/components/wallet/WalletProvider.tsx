'use client';

import { ReactNode, useEffect } from 'react';
import { initializeWallet } from '../../lib/web3';

export function WalletProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeWallet();
  }, []);

  return <>{children}</>;
}