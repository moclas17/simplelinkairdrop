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
    icon: '🔴',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000021, // ETH per transaction
    isLightColor: false
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
    icon: '🔵',
    blocksPerDay: 23000, // ~4 second blocks
    gasCostPerTx: 0.0021, // ETH per transaction
    isLightColor: true
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
    icon: '🔷',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000021, // ETH per transaction
    isLightColor: false
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
    icon: '📜',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000021, // ETH per transaction
    isLightColor: true
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
    icon: '🟫',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000021, // MNT per transaction
    isLightColor: false
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
  
  const totalCost = network.gasCostPerTx * numberOfTransactions;
  const safetyMargin = 1.5; // 50% extra for safety
  const recommendedAmount = totalCost * safetyMargin;
  
  return {
    network: network.name,
    currency: network.currency,
    costPerTransaction: network.gasCostPerTx,
    totalTransactions: numberOfTransactions,
    estimatedTotalCost: totalCost,
    recommendedAmount: recommendedAmount,
    formattedCost: totalCost.toFixed(6),
    formattedRecommended: recommendedAmount.toFixed(6)
  };
}

// Get blocks per day for a chain
export function getBlocksPerDay(chainId) {
  const network = getNetworkInfo(chainId);
  return network ? network.blocksPerDay : 7200; // Default fallback
}

// Get gas cost per transaction for a chain
export function getGasCostPerTx(chainId) {
  const network = getNetworkInfo(chainId);
  return network ? { costPerTx: network.gasCostPerTx, currency: network.currency } : null;
}

// Check if a network color is light (for text contrast)
export function isLightColor(chainId) {
  const network = getNetworkInfo(chainId);
  return network ? network.isLightColor : false;
}

// Get list of all supported networks (for UI)
export function getAllNetworks() {
  return Object.values(SUPPORTED_NETWORKS);
}

// Get supported chain IDs array
export function getSupportedChainIds() {
  return Object.keys(SUPPORTED_NETWORKS).map(id => parseInt(id));
}

// Get network names list (for error messages)
export function getNetworkNamesList() {
  return Object.values(SUPPORTED_NETWORKS).map(n => n.name).join(', ');
}

export default SUPPORTED_NETWORKS;