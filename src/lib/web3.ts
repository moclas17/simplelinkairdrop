'use client'

// Simple wallet connection interface that works without complex dependencies
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isAdmin: boolean;
}

export const initializeWallet = () => {
  // This will be replaced with actual AppKit implementation after deployment
  console.log('Wallet system initialized');
};