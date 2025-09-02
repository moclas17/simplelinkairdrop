'use client'

import { useState, useEffect } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'

// Admin wallets that have access to dashboard
const ADMIN_WALLETS = [
  '0x86300E0a857aAB39A601E89b0e7F15e1488d9F0C', // Hot wallet from env
  // Add more admin wallet addresses here
].map(addr => addr.toLowerCase())

export function useWalletAuth() {
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      const isAdminWallet = ADMIN_WALLETS.includes(address.toLowerCase())
      setIsAdmin(isAdminWallet)
      
      if (!isAdminWallet) {
        setError('This wallet does not have admin access')
      } else {
        setError(null)
      }
    } else {
      setIsAdmin(false)
      setError(null)
    }
  }, [isConnected, address])

  const connectWallet = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await open()
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const signMessage = async (message: string) => {
    if (!walletProvider || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const signer = await ethersProvider.getSigner()
      const signature = await signer.signMessage(message)
      return signature
    } catch (err: any) {
      throw new Error(err.message || 'Failed to sign message')
    }
  }

  const disconnect = async () => {
    // The disconnect is handled by the AppKit modal
    setIsAdmin(false)
    setError(null)
  }

  return {
    address,
    isConnected,
    isAdmin,
    isLoading: isLoading || status === 'connecting',
    error,
    connectWallet,
    signMessage,
    disconnect
  }
}