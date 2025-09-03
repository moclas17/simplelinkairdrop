// Client-side network configuration (no ES6 modules)
// This file can be included directly in HTML <script> tags

window.SUPPORTED_NETWORKS = {
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
  },

  // Optimism Sepolia Testnet
  11155420: {
    name: 'Optimism Sepolia',
    shortName: 'OP Sepolia',
    chainId: 11155420,
    chainIdHex: '0xaa37dc',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    color: '#FF0420',
    icon: '🔴',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000001, // ETH per transaction (testnet)
    isLightColor: false
  },

  // Arbitrum Sepolia Testnet
  421614: {
    name: 'Arbitrum Sepolia',
    shortName: 'Arb Sepolia',
    chainId: 421614,
    chainIdHex: '0x66eee',
    currency: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    color: '#96BEDC',
    icon: '🔵',
    blocksPerDay: 23000, // ~4 second blocks
    gasCostPerTx: 0.000001, // ETH per transaction (testnet)
    isLightColor: true
  },

  // Base Sepolia Testnet
  84532: {
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    chainId: 84532,
    chainIdHex: '0x14a34',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    color: '#0052FF',
    icon: '🔷',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000001, // ETH per transaction (testnet)
    isLightColor: false
  },

  // Scroll Sepolia Testnet
  534351: {
    name: 'Scroll Sepolia',
    shortName: 'Scroll Sepolia',
    chainId: 534351,
    chainIdHex: '0x8274f',
    currency: 'ETH',
    rpcUrl: 'https://sepolia-rpc.scroll.io',
    explorerUrl: 'https://sepolia.scrollscan.com',
    color: '#FFEEDA',
    icon: '📜',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000001, // ETH per transaction (testnet)
    isLightColor: true
  },

  // Mantle Sepolia Testnet
  5003: {
    name: 'Mantle Sepolia',
    shortName: 'Mantle Sepolia',
    chainId: 5003,
    chainIdHex: '0x138b',
    currency: 'MNT',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://sepolia.mantlescan.xyz',
    color: '#000000',
    icon: '🟫',
    blocksPerDay: 43200, // ~2 second blocks
    gasCostPerTx: 0.000001, // MNT per transaction (testnet)
    isLightColor: false
  },

  // Monad Testnet
  10143: {
    name: 'Monad Testnet',
    shortName: 'Monad',
    chainId: 10143,
    chainIdHex: '0x279f',
    currency: 'MON',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    explorerUrl: 'https://testnet.monadexplorer.com',
    color: '#7B3F98',
    icon: '🟣',
    blocksPerDay: 86400, // ~1 second blocks
    gasCostPerTx: 0.00001, // MON per transaction (estimated)
    isLightColor: false
  }
};

// Helper functions
window.getNetworkInfo = function(chainId) {
  const numericChainId = typeof chainId === 'string' 
    ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
    : chainId;
  
  return window.SUPPORTED_NETWORKS[numericChainId] || null;
};

window.getAllNetworks = function() {
  return Object.values(window.SUPPORTED_NETWORKS);
};

window.isLightColor = function(chainId) {
  const network = window.getNetworkInfo(chainId);
  return network ? network.isLightColor : false;
};

window.getGasCostEstimate = function(chainId, numberOfTransactions) {
  const network = window.getNetworkInfo(chainId);
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
};

window.getNetworkNamesList = function() {
  return Object.values(window.SUPPORTED_NETWORKS).map(n => n.name).join(', ');
};

window.getBlocksPerDay = function(chainId) {
  const network = window.getNetworkInfo(chainId);
  return network ? network.blocksPerDay : 7200; // Default fallback
};