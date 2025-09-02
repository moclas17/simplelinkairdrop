import { cookieStorage, createStorage, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, optimism, base } from '@reown/appkit/networks'

// Get projectId from environment variables
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined')
}

// Define the networks we want to support
export const networks = [mainnet, arbitrum, optimism, base]

// Create the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ 
    storage: cookieStorage 
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig