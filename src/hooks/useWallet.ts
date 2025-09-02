'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()

  const connectWallet = () => {
    open()
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const openModal = () => {
    open()
  }

  return {
    address,
    isConnected,
    isLoading: isConnecting,
    connectWallet,
    openModal,
    disconnect: disconnectWallet
  }
}