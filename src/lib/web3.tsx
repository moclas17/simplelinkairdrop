'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum, optimism, base, scroll } from '@reown/appkit/networks'

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '0bc197835c70d1e0266f20e609b5a45a'

// Create the metadata
const metadata = {
  name: 'ChingaDrop',
  description: 'Multi-chain token airdrop platform',
  url: 'https://simplelinkairdrop-onjyk2zyi-nftrenegadoscls-projects.vercel.app',
  icons: ['https://simplelinkairdrop-onjyk2zyi-nftrenegadoscls-projects.vercel.app/favicon.ico']
}

// Create Ethers adapter
const ethersAdapter = new EthersAdapter()

// Create the modal
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [mainnet, arbitrum, optimism, base, scroll],
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false
  }
})