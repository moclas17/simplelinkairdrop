'use client'

import { useState, useEffect } from 'react'

// Lista de wallets admin autorizadas  
const ADMIN_WALLETS = [
  '0x86300E0a857aAB39A601E89b0e7F15e1488d9F0C', // Hot wallet from env
  // Agregar más wallets admin aquí
].map(addr => addr.toLowerCase())

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
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
            setIsAdmin(ADMIN_WALLETS.includes(connectedAddress.toLowerCase()))
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
        setIsAdmin(ADMIN_WALLETS.includes(connectedAddress.toLowerCase()))
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
    setIsAdmin(false)
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
    isAdmin,
    isLoading,
    connectWallet,
    openModal,
    disconnect
  }
}