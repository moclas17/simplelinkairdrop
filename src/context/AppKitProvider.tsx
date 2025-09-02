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
  url: typeof window !== 'undefined' ? window.location.origin : 'https://simplelinkairdrop-axh8pdwk8-nftrenegadoscls-projects.vercel.app',
  icons: ['/favicon.ico']
}

// Create the AppKit modal
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, arbitrum, optimism, base] as any,
    defaultNetwork: mainnet,
    metadata,
    features: {
      analytics: false
    }
  })
}

const queryClient = new QueryClient()

export default function AppKitProvider({ 
  children, 
  cookies 
}: { 
  children: ReactNode
  cookies?: string | null 
}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={cookies ? JSON.parse(cookies) : undefined}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}