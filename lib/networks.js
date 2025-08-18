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

// Gas cost estimation for different networks
export function getGasCostEstimate(chainId, numberOfTransactions) {
  const network = getNetworkInfo(chainId);
  if (!network) return null;
  
  // Gas costs per transaction (in gwei) - approximate estimates
  const gasEstimates = {
    10: { // Optimism
      gasPerTx: 21000, // Base transfer gas
      gasPriceGwei: 0.001, // Very low on Optimism
      ethCost: 0.000021 // ETH per transaction
    },
    42161: { // Arbitrum
      gasPerTx: 21000,
      gasPriceGwei: 0.1, // Low on Arbitrum
      ethCost: 0.0021 // ETH per transaction
    },
    8453: { // Base
      gasPerTx: 21000,
      gasPriceGwei: 0.001, // Very low on Base
      ethCost: 0.000021 // ETH per transaction
    },
    534352: { // Scroll
      gasPerTx: 21000,
      gasPriceGwei: 0.001, // Low on Scroll
      ethCost: 0.000021 // ETH per transaction
    },
    5000: { // Mantle - uses MNT not ETH
      gasPerTx: 21000,
      gasPriceGwei: 0.001,
      ethCost: 0.000021 // MNT per transaction
    }
  };
  
  const estimate = gasEstimates[chainId];
  if (!estimate) return null;
  
  const totalCost = estimate.ethCost * numberOfTransactions;
  const safetyMargin = 1.5; // 50% extra for safety
  const recommendedAmount = totalCost * safetyMargin;
  
  return {
    network: network.name,
    currency: network.currency,
    gasPerTransaction: estimate.gasPerTx,
    gasPriceGwei: estimate.gasPriceGwei,
    costPerTransaction: estimate.ethCost,
    totalTransactions: numberOfTransactions,
    estimatedTotalCost: totalCost,
    recommendedAmount: recommendedAmount,
    formattedCost: totalCost.toFixed(6),
    formattedRecommended: recommendedAmount.toFixed(6)
  };
}

export default SUPPORTED_NETWORKS;