// Reown AppKit Configuration
// Replace with your actual project ID from https://dashboard.reown.com
export const REOWN_CONFIG = {
  projectId: 'YOUR_REOWN_PROJECT_ID', // Get this from Reown Dashboard
  appName: 'Chingadrop.xyz',
  appDescription: 'Token distribution platform',
  appUrl: window.location.origin,
  appIcons: ['https://avatars.githubusercontent.com/u/179229932'],
  defaultNetwork: 'mainnet', // or 'arbitrum', 'polygon', etc.
  supportedNetworks: ['mainnet', 'arbitrum'], // Add more networks as needed
  theme: {
    primary: '#7dd3fc',
    background: '#0b1220',
    card: '#121a2a',
    text: '#e6eefc',
    muted: '#7e8aa0'
  }
};

// Network configurations
export const NETWORKS = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://ethereum.publicnode.com',
    explorer: 'https://etherscan.io'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arbitrum-one.publicnode.com',
    explorer: 'https://arbiscan.io'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com'
  }
};

// Helper function to get current network
export function getCurrentNetwork() {
  return NETWORKS[REOWN_CONFIG.defaultNetwork];
}

// Helper function to validate project ID
export function validateProjectId() {
  if (!REOWN_CONFIG.projectId || REOWN_CONFIG.projectId === 'YOUR_REOWN_PROJECT_ID') {
    console.error('❌ Please set your Reown Project ID in reown-config.js');
    return false;
  }
  return true;
}
