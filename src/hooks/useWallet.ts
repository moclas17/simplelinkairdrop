'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()

  const connectWallet = () => {
    try {
      open()
    } catch (error) {
      console.error('Failed to open AppKit modal:', error)
      // Fallback: Show user-friendly message
      alert('Please connect your wallet manually or refresh the page.')
    }
  }

  const disconnectWallet = () => {
    try {
      disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const openModal = () => {
    try {
      open()
    } catch (error) {
      console.error('Failed to open modal:', error)
    }
  }

  return {
    address,
    isConnected,
    isLoading: isConnecting,
    connectWallet,
    openModal,
    disconnect: disconnectWallet,
    disconnectWallet
  }
}