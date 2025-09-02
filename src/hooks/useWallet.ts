'use client'

import { useState, useEffect } from 'react'

// Removed admin wallet restrictions - all connected wallets can access dashboard

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Check for existing connection
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            const connectedAddress = accounts[0]
            setAddress(connectedAddress)
            setIsConnected(true)
          }
        })
        .catch(console.error)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet!')
      return
    }

    setIsLoading(true)
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length > 0) {
        const connectedAddress = accounts[0]
        setAddress(connectedAddress)
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
  }

  const openModal = () => {
    if (!isConnected) {
      connectWallet()
    } else {
      // Show simple disconnect option
      if (confirm('Disconnect wallet?')) {
        disconnect()
      }
    }
  }

  return {
    address,
    isConnected,
    isLoading,
    connectWallet,
    openModal,
    disconnect
  }
}