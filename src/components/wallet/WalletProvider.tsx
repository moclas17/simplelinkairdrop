'use client';

import { ReactNode, useEffect } from 'react';
import '../../lib/web3'; // Initialize the AppKit

export function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}