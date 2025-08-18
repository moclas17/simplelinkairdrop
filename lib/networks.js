// Multi-chain network configuration
export const SUPPORTED_NETWORKS = {
  // Optimism (Original network)
  10: {
    name: 'Optimism',
    shortName: 'Optimism',
    chainId: 10,
    chainIdHex: '0xa',
    currency: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    icon: '🔴'
  },

  // Arbitrum One
  42161: {
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    chainId: 42161,
    chainIdHex: '0xa4b1',
    currency: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    color: '#96BEDC',
    icon: '🔵'
  },
  
  // Base
  8453: {
    name: 'Base',
    shortName: 'Base',
    chainId: 8453,
    chainIdHex: '0x2105',
    currency: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    color: '#0052FF',
    icon: '🔷'
  },
  
  // Scroll
  534352: {
    name: 'Scroll',
    shortName: 'Scroll',
    chainId: 534352,
    chainIdHex: '0x82750',
    currency: 'ETH',
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    color: '#FFEEDA',
    icon: '📜'
  },
  
  // Mantle
  5000: {
    name: 'Mantle',
    shortName: 'Mantle',
    chainId: 5000,
    chainIdHex: '0x1388',
    currency: 'MNT',
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://mantlescan.xyz',
    color: '#000000',
    icon: '🟫'
  }
};

// Get network info by chain ID
export function getNetworkInfo(chainId) {
  const numericChainId = typeof chainId === 'string' 
    ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
    : chainId;
  
  return SUPPORTED_NETWORKS[numericChainId] || null;
}

// Get all supported chain IDs
export function getSupportedChainIds() {
  return Object.keys(SUPPORTED_NETWORKS).map(id => parseInt(id));
}

// Check if network is supported
export function isNetworkSupported(chainId) {
  return getNetworkInfo(chainId) !== null;
}

// Get RPC URL for chain ID
export function getRpcUrl(chainId) {
  const network = getNetworkInfo(chainId);
  return network ? network.rpcUrl : null;
}

// Get explorer URL for chain ID
export function getExplorerUrl(chainId) {
  const network = getNetworkInfo(chainId);
  return network ? network.explorerUrl : null;
}

export default SUPPORTED_NETWORKS;