'use client'

import { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiAdapter, projectId } from '@/config/wagmi'
import { mainnet, arbitrum, optimism, base } from '@reown/appkit/networks'

// Set up the AppKit modal
const metadata = {
  name: 'ChingaDrop',
  description: 'Multi-chain token airdrop platform',
  url: 'https://chingadrop.xyz',
  icons: ['https://chingadrop.xyz/favicon.ico']
}

// Create the AppKit modal
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum, optimism, base],
    defaultNetwork: mainnet,
    metadata,
    features: {
      analytics: false,
      socials: false,
      email: false,
      onramp: false
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-z-index': 9999
    }
  })
}

const queryClient = new QueryClient()

export default function AppKitProvider({ 
  children 
}: { 
  children: ReactNode
}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}