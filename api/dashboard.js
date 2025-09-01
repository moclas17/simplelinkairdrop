export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const reownProjectId = process.env.REOWN_PROJECT_ID || 'c0d6a88c5088f3b1de2a59932b6b5b2f';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Dashboard - Chingadrop.xyz</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --green:#22c55e; --red:#ef4444; --orange:#f59e0b; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; padding:24px; }
    .container { max-width:1200px; margin:0 auto; }
    .card { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:32px; margin-bottom:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
    h1 { margin:0 0 16px; font-size: clamp(24px, 4vw, 32px); letter-spacing: 0.3px; color: var(--acc); }
    h2 { margin:24px 0 12px; font-size: 20px; color: var(--acc); }
    h3 { margin:16px 0 8px; font-size: 16px; color: var(--acc); }
    p { margin:0 0 16px; color: var(--muted); line-height: 1.6; }
    
    /* Buttons */
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, #1e293b, #0f172a); color:white; font-weight:600; cursor:pointer; text-decoration:none; transition: all 0.2s ease; min-height: 44px; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: linear-gradient(180deg, var(--acc), #0ea5e9); color: #0b1220; border-color: var(--acc); }
    .btn-success { background: linear-gradient(180deg, var(--green), #16a34a); border-color: var(--green); }
    .btn-danger { background: linear-gradient(180deg, var(--red), #dc2626); border-color: var(--red); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    
    /* Wallet section */
    .wallet-section { text-align: center; padding: 60px 20px; position: relative; z-index: 1000; }
    .wallet-btn { font-size: 18px; padding: 16px 32px; min-width: 200px; position: relative; z-index: 1001; }
    .metamask-icon { width: 24px; height: 24px; margin-right: 8px; }
    
    /* User info */
    .user-info { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(125,211,252,0.08); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; margin-bottom: 24px; }
    .wallet-address { font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; color: var(--acc); }
    
    /* Mobile responsive for user info */
    @media (max-width: 768px) {
      .user-info { 
        flex-direction: column; 
        gap: 16px; 
        padding: 16px; 
        text-align: center; 
      }
      .user-info .wallet-info { 
        width: 100%; 
      }
      .user-info .button-group { 
        display: flex; 
        flex-direction: column; 
        gap: 8px; 
        width: 100%; 
      }
      .user-info .button-group .btn { 
        width: 100%; 
        justify-content: center; 
        font-size: 14px; 
        padding: 12px 16px; 
      }
      .wallet-address { 
        font-size: 12px; 
        word-break: break-all; 
        line-height: 1.4; 
      }
    }
    
    /* Campaigns */
    .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 20px; }
    .campaign-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; transition: transform 0.2s ease; }
    .campaign-card:hover { transform: translateY(-2px); }
    
    /* Status badges */
    .status { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
    .status-draft { background: rgba(126,138,160,0.2); color: var(--muted); }
    .status-pending { background: rgba(245,158,11,0.2); color: var(--orange); }
    .status-active { background: rgba(34,197,94,0.2); color: var(--green); }
    .status-completed { background: rgba(34,197,94,0.3); color: var(--green); }
    
    /* Forms */
    .hidden { display: none; }
    .form-group { margin-bottom: 24px; }
    .form-group label { display: block; margin-bottom: 8px; color: var(--text); font-weight: 500; font-size: 14px; }
    .form-group .label-help { font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 4px; }
    .form-group input, .form-group select, .form-group textarea { 
      width: 100%; 
      padding: 14px 16px; 
      border: 1px solid rgba(255,255,255,0.15); 
      border-radius: 10px; 
      background: rgba(15,23,41,0.8); 
      color: var(--text); 
      font-size: 14px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { 
      outline: none; 
      border-color: var(--acc); 
      box-shadow: 0 0 0 3px rgba(125,211,252,0.1);
    }
    .form-group input::placeholder { color: rgba(126,138,160,0.6); }
    
    /* Form layout */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; gap: 16px; }
    }
    
    /* Explanations */
    .explanation-box { 
      background: rgba(125,211,252,0.05); 
      border: 1px solid rgba(125,211,252,0.15); 
      border-radius: 8px; 
      padding: 12px 16px; 
      margin-top: 8px; 
      font-size: 13px; 
      color: var(--muted); 
      line-height: 1.4;
    }
    
    /* Budget display */
    .budget-display { 
      background: linear-gradient(135deg, rgba(125,211,252,0.1), rgba(34,197,94,0.1)); 
      border: 1px solid rgba(125,211,252,0.2); 
      border-radius: 12px; 
      padding: 20px; 
      text-align: center;
    }
    .budget-amount { font-size: 24px; font-weight: 700; color: var(--green); }
    .budget-symbol { font-size: 18px; color: var(--acc); margin-left: 8px; }
    
    /* Modal */
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(4px); }
    .modal-content { 
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); 
      border: 1px solid rgba(255,255,255,0.1); 
      border-radius: 24px; 
      padding: 32px; 
      max-width: 700px; 
      width: 90%; 
      max-height: 85vh; 
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .close-btn { float: right; font-size: 28px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px; border-radius: 4px; transition: color 0.2s ease; }
    .close-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
    
    /* Toast */
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; border-radius: 12px; font-weight: 500; z-index: 1001; box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .toast-success { background: var(--green); color: white; }
    .toast-error { background: var(--red); color: white; }
    .toast-info { background: var(--acc); color: white; }
    
    /* Empty state */
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-state h3 { color: var(--muted); margin-bottom: 8px; }
  </style>
  <script src="../lib/networks-client.js"></script>
  
  <!-- Reown AppKit for vanilla JavaScript -->
  <script type="module">
    import { createAppKit } from 'https://esm.sh/@reown/appkit@1.8.1'
    import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@1.8.1'
    
    // Initialize Reown AppKit
    const projectId = '${reownProjectId}';
    
    // Networks configuration
    const networks = [
      // Mainnets
      {
        id: 10,
        name: 'Optimism',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } },
        blockExplorers: { default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' } }
      },
      {
        id: 42161,
        name: 'Arbitrum One',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } },
        blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } }
      },
      {
        id: 8453,
        name: 'Base',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
        blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } }
      },
      {
        id: 534352,
        name: 'Scroll',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.scroll.io'] } },
        blockExplorers: { default: { name: 'Scrollscan', url: 'https://scrollscan.com' } }
      },
      {
        id: 5000,
        name: 'Mantle',
        nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.mantle.xyz'] } },
        blockExplorers: { default: { name: 'Mantlescan', url: 'https://mantlescan.xyz' } }
      },
      // Testnets
      {
        id: 11155420,
        name: 'Optimism Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.optimism.io'] } },
        blockExplorers: { default: { name: 'Optimistic Etherscan', url: 'https://sepolia-optimism.etherscan.io' } }
      },
      {
        id: 421614,
        name: 'Arbitrum Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] } },
        blockExplorers: { default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' } }
      },
      {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
        blockExplorers: { default: { name: 'Basescan', url: 'https://sepolia.basescan.org' } }
      },
      {
        id: 534351,
        name: 'Scroll Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia-rpc.scroll.io'] } },
        blockExplorers: { default: { name: 'Scrollscan', url: 'https://sepolia.scrollscan.com' } }
      },
      {
        id: 5003,
        name: 'Mantle Sepolia',
        nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.sepolia.mantle.xyz'] } },
        blockExplorers: { default: { name: 'Mantlescan', url: 'https://sepolia.mantlescan.xyz' } }
      },
      {
        id: 10143,
        name: 'Monad Testnet',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
        blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } }
      }
    ];
    
    // Create AppKit instance
    const appKit = createAppKit({
      adapters: [new EthersAdapter()],
      networks,
      projectId,
      metadata: {
        name: 'Chingadrop.xyz',
        description: 'Token Distribution Platform',
        url: window.location.origin,
        icons: [window.location.origin + '/icons/icon-192x192.png']
      },
      features: {
        analytics: false,
        onramp: false,
        swaps: false,
        email: true,
        socials: ['google', 'x', 'github', 'discord', 'apple'],
        emailShowWallets: true
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#7dd3fc',
        '--w3m-color-mix': '#0b1220',
        '--w3m-color-mix-strength': 20,
        '--w3m-border-radius-master': '12px',
        '--w3m-font-size-master': '14px'
      }
    });
    
    // Make AppKit available globally
    window.appKit = appKit;
    
    // Set up event listeners
    appKit.subscribeAccount((account) => {
      if (account.address && account.address !== window.currentUser) {
        window.currentUser = account.address;
        console.log('User connected:', account.address);
        
        if (!document.getElementById('dashboardSection').classList.contains('hidden')) {
          window.showDashboard();
          window.loadCampaigns();
        }
      } else if (!account.address && window.currentUser) {
        window.currentUser = null;
        window.showWalletSection();
      }
    });
    
    appKit.subscribeChainId((chainId) => {
      const networkInfo = getNetworkInfo(chainId);
      if (networkInfo) {
        window.currentNetwork = networkInfo;
        if (window.updateNetworkDisplay) {
          window.updateNetworkDisplay();
        }
      }
    });
    
    // Check if already connected
    setTimeout(() => {
      const state = appKit.getState();
      if (state.address) {
        window.currentUser = state.address;
        if (state.selectedNetworkId) {
          const networkInfo = getNetworkInfo(state.selectedNetworkId);
          window.currentNetwork = networkInfo;
        }
        window.showDashboard();
        window.loadCampaigns();
      }
    }, 1000);
    
  </script>
  
  <script>
    // Global variables for AppKit integration
    window.currentUser = null;
    window.currentNetwork = null;
    
    // Network detection and display functions
    window.updateNetworkDisplay = function() {
      const networkInfoElement = document.getElementById('networkInfo');
      if (!networkInfoElement) return;
      
      if (window.currentNetwork) {
        networkInfoElement.innerHTML = '<span style="color: ' + window.currentNetwork.color + ';">' + window.currentNetwork.icon + '</span>' +
                                       '<span>' + window.currentNetwork.name + '</span>' +
                                       '<span style="font-size: 12px; color: var(--muted); margin-left: 4px;">(' + window.currentNetwork.currency + ')</span>';
        networkInfoElement.style.color = window.currentNetwork.color;
      } else {
        networkInfoElement.innerHTML = '<span style="color: var(--red);">❌ Unsupported Network</span>';
        networkInfoElement.style.color = 'var(--red)';
      }
    }
    
    // UI functions
    window.showWalletSection = function() {
      document.getElementById('walletSection').classList.remove('hidden');
      document.getElementById('dashboardSection').classList.add('hidden');
    }
    
    window.showDashboard = function() {
      console.log('Showing dashboard...');
      document.getElementById('walletSection').classList.add('hidden');
      document.getElementById('dashboardSection').classList.remove('hidden');
      
      // Truncate wallet address for better mobile display
      const walletElement = document.getElementById('userWallet');
      if (window.currentUser && window.currentUser.length > 20) {
        const truncated = window.currentUser.substring(0, 6) + '...' + window.currentUser.substring(window.currentUser.length - 4);
        walletElement.textContent = truncated;
        walletElement.title = window.currentUser; // Show full address on hover
      } else {
        walletElement.textContent = window.currentUser;
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <!-- Wallet Connection Section -->
    <div id="walletSection" class="card wallet-section">
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDwhLS0gR3JhZGllbnRlcyBwYXJhIGVsIHBhcmFjYcOtZGFzIC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJwYXJhY2h1dGVHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3ZGQzZmMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzOGJkZjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGVhNWU5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIEdyYWRpZW50ZSBwYXJhIGxhIGNhamEgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJveEdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZiYmYyNCIvPgogICAgICA8c3RvcCBvZmZmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjU5ZTBiIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIFNvbWJyYSBkZWwgcGFyYWNhw61kYXMgLS0+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMiIgc3RkRGV2aWF0aW9uPSIzIiBmbG9vZC1jb2xvcj0iIzBlYTVlOSIgZmxvb2Qtb3BhY2l0eT0iMC4zIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgCiAgPCEtLSBQYXJhY2HDrWRhcyBwcmluY2lwYWwgLS0+CiAgPHBhdGggZD0iTTIwIDM1IFE1MCAxNSA4MCAzNSBRNzUgNDUgNzAgNTAgTDY1IDQ1IFE1MCAyNSAzNSA0NSBMM0AgNTAgUTI1IDQ1IDIwIDM1IFoiIAogICAgICAgIGZpbGw9InVybCgjcGFyYWNodXRlR3JhZGllbnQpIiAKICAgICAgICBmaWx0ZXI9InVybCgjc2hhZG93KSIvPgogIAogIDwhLS0gTMOtbmVhcyBkZWwgcGFyYWNhw61kYXMgLS0+CiAgPHBhdGggZD0iTTI1IDQwIFE1MCAyMCA3NSA0MCIgc3Ryb2tlPSIjMDM2OWExIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNiIvPgogIDxwYXRoIGQ9Ik0zMCA0NSBRNTAgMjUgNzAgNDUiIHN0cm9rZT0iIzAzNjlhMSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjQiLz4KICA8IS0tIEN1ZXJkYXMgZGVsIHBhcmFjYcOtZGFzIC0tPgogIDxsaW5lIHgxPSIyNSIgeTE9IjQ4IiB4Mj0iNDIiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSIzOCIgeTE9IjQ4IiB4Mj0iNDYiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI2MiIgeTE9IjQ4IiB4Mj0iNTQiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI3NSIgeTE9IjQ4IiB4Mj0iNTgiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIAogIDwhLS0gQ2FqYS9wYXF1ZXRlIC0tPgogIDxyZWN0IHg9IjQyIiB5PSI3MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiByeD0iMiIgCiAgICAgICAgZmlsbD0idXJsKCNib3hHcmFkaWVudCkiIAogICAgICAgIHN0cm9rZT0iI2Q5NzcwNiIgCiAgICAgICAgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBEZXRhbGxlcyBkZSBsYSBjYWphIC0tPgogIDxsaW5lIHgxPSI0MiIgeTE9Ijc2IiB4Mj0iNTgiIHkyPSI3NiIgc3Ryb2tlPSIjZDk3NzA2IiBzdHJva2Utd2lkdGg9IjEiLz4KICA8bGluZSB4MT0iNTAiIHkxPSI3MCIgeDI9IjUwIiB5Mj0iODIiIHN0cm9rZT0iI2Q5NzcwNiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBQdW50b3MgZGUgYnJpbGxvIGVuIGVsIHBhcmFjYcOtZGFzIC0tPgogIDxjaXJjbGUgY3g9IjM1IiBjeT0iMzIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNiIvPgogIDxjaXJjbGUgY3g9IjY1IiBjeT0iMzUiIHI9IjEuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+Cjwvc3ZnPg==" alt="Chingadrop.xyz" style="width:48px; height:48px; margin-right:16px;">
        <h1 style="margin: 0;">🎯 Campaign Dashboard</h1>
      </div>
      <p style="margin-bottom: 24px;">Connect your wallet to create and manage token distribution campaigns</p>
      
      <div id="walletStatus" style="margin-bottom: 20px;">
        <div id="noWalletMessage" class="explanation-box" style="margin-bottom: 16px; display: block;">
          🔗 Click "Connect Wallet" to access your Web3 wallet. Works with MetaMask, Coinbase Wallet, WalletConnect and more.
        </div>
        <div id="walletDetectedMessage" class="explanation-box" style="margin-bottom: 16px; background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); display: none;">
          ✅ Web3 wallet ready! Click the button below to connect.
        </div>
      </div>
      
      <!-- Reown AppKit Connect Button -->
      <button id="connectWalletBtn" class="btn btn-primary wallet-btn" onclick="window.appKit.open()">
        🔗 Connect Wallet
      </button>
    </div>

    <!-- Dashboard Section (hidden initially) -->
    <div id="dashboardSection" class="hidden">
      <!-- User Info -->
      <div class="user-info">
        <div class="wallet-info">
          <div style="margin-bottom: 8px;">
            <strong>Connected Wallet:</strong> <span id="userWallet" class="wallet-address">-</span>
          </div>
          <div style="margin-bottom: 16px;">
            <strong>Network:</strong> <span id="networkInfo" style="display: inline-flex; align-items: center; gap: 6px;">-</span>
          </div>
        </div>
        <div class="button-group" style="display: flex; gap: 8px; align-items: center;">
          <button id="switchNetworkBtn" class="btn" onclick="window.appKit.open({ view: 'Networks' })">Switch Network</button>
          <button id="disconnectBtn" class="btn btn-danger" onclick="window.appKit.disconnect()">Disconnect</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="card">
        <h2>📊 Your Campaigns</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <p>Create and manage your token distribution campaigns</p>
          <a href="#" id="createCampaignBtn" class="btn btn-primary">
            ➕ Create Campaign
          </a>
        </div>
        
        <div id="campaignsGrid" class="campaigns-grid">
          <!-- Campaigns will be loaded here -->
        </div>
      </div>
    </div>

  </div>

  <script>
    // Campaign management
    function goToCreateCampaign() {
      console.log('goToCreateCampaign called, currentUser:', currentUser);
      // Only allow creating campaign if user is connected
      if (!currentUser) {
        showToast('Please connect your wallet first', 'error');
        return;
      }
      console.log('Redirecting to create campaign page...');
      window.location.href = '/create-campaign?wallet=' + currentUser;
    }


    async function loadCampaigns() {
      try {
        const response = await fetch('/api/campaigns?walletAddress=' + currentUser);
        const data = await response.json();
        
        const grid = document.getElementById('campaignsGrid');
        
        if (data.campaigns && data.campaigns.length > 0) {
          grid.innerHTML = data.campaigns.map(function(campaign) {
            var html = '<div class="campaign-card">';
            html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">';
            html += '<div>';
            html += '<h3 style="margin: 0 0 4px 0;">' + campaign.title + '</h3>';
            // Add network badge
            var networkInfo = getNetworkInfo(campaign.chain_id);
            if (networkInfo) {
              var textColor = isLightColor(campaign.chain_id) ? '#000' : '#fff';
              html += '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ' + networkInfo.color + '; color: ' + textColor + ';">';
              html += networkInfo.icon + ' ' + networkInfo.name;
              html += '</span>';
            }
            html += '</div>';
            html += '<span class="status status-' + campaign.status.replace('_', '-') + '">' + campaign.status.toUpperCase().replace('_', ' ') + '</span>';
            html += '</div>';
            html += '<p>' + (campaign.description || 'No description') + '</p>';
            
            if (campaign.status === 'pending_funding') {
              html += '<div class="funding-info" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 16px; margin: 12px 0;">';
              html += '<h4 style="margin: 0 0 8px; color: var(--orange);">💰 Fund Campaign</h4>';
              html += '<p style="margin: 0 0 8px; font-size: 13px;">Send <strong>' + campaign.total_budget + ' ' + campaign.token_symbol + '</strong> to:</p>';
              html += '<div style="font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; word-break: break-all;">' + campaign.deposit_address + '</div>';
              html += '<button onclick="checkFunding(' + "'" + campaign.id + "'" + ')" class="btn" style="margin-top: 12px; width: 100%; font-size: 12px;">Check Funding Status</button>';
              html += '</div>';
            }
            
            if (campaign.status === 'active') {
              if (campaign.links_generated) {
                // When links are generated - show status indicator and action buttons
                html += '<div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; padding: 12px; margin: 12px 0;">';
                html += '<div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--green); font-size: 12px; font-weight: 500;">';
                html += '<span style="margin-right: 6px;">✅</span>Links Generated & Ready';
                html += '</div>';
                html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
                html += '<button onclick="viewExistingLinks(' + "'" + campaign.id + "'" + ')" class="btn btn-success" style="font-size: 11px; padding: 10px;">📋 View Links</button>';
                html += '<button onclick="viewStats(' + "'" + campaign.id + "'" + ')" class="btn" style="font-size: 11px; padding: 10px;">📊 Analytics</button>';
                html += '</div>';
                html += '</div>';
              } else {
                // When links need to be generated
                html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">';
                html += '<button onclick="generateLinks(' + "'" + campaign.id + "'" + ')" class="btn btn-primary" style="font-size: 11px; padding: 10px;">🚀 Generate Links</button>';
                html += '<button onclick="viewStats(' + "'" + campaign.id + "'" + ')" class="btn" style="font-size: 11px; padding: 10px;">📊 Analytics</button>';
                html += '</div>';
              }
            }
            
            html += '<div style="font-size: 14px; color: var(--muted);">';
            html += '<div>Type: ' + (campaign.claim_type === 'multi' ? 'Multi-claim' : 'Single-use') + '</div>';
            html += '<div>Budget: ' + campaign.total_budget + ' ' + campaign.token_symbol + '</div>';
            html += '<div>Created: ' + new Date(campaign.created_at).toLocaleDateString() + '</div>';
            html += '</div>';
            html += '</div>';
            
            return html;
          }).join('');
        } else {
          grid.innerHTML = '<div class="empty-state"><h3>No campaigns yet</h3><p>Create your first campaign to get started!</p></div>';
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        showToast('Failed to load campaigns', 'error');
      }
    }

    function showToast(message, type) {
      const toast = document.createElement('div');
      toast.className = "toast toast-" + type;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }


    // Campaign action functions
    window.checkFunding = async function(campaignId) {
      console.log('🔍 Check Funding clicked for campaign:', campaignId);
      console.log('👤 Current user:', currentUser);
      
      if (!currentUser) {
        showToast('Please connect your wallet first', 'error');
        return;
      }
      
      showToast('Checking funding status...', 'info');
      
      try {
        console.log('📡 Sending funding check request...');
        const requestBody = { 
          campaignId: campaignId, 
          action: 'check_funding',
          walletAddress: currentUser 
        };
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📋 Response result:', result);
        
        if (response.ok) {
          if (result.funded) {
            console.log('✅ Funding verified successfully');
            showToast(result.message || 'Campaign activated! You can now generate links.', 'success');
            loadCampaigns(); // Refresh to show new status
          } else {
            console.log('❌ Funding not detected:', result);
            const errorMsg = result.details || result.error || 'Funding not detected yet. Please send the required tokens first.';
            showToast(errorMsg, 'error');
          }
        } else {
          console.log('❌ API request failed:', response.status, result);
          const errorMsg = result.details || result.error || 'Failed to check funding';
          showToast(errorMsg, 'error');
        }
      } catch (error) {
        console.error('Check funding error:', error);
        showToast('Failed to check funding', 'error');
      }
    };

    window.generateLinks = async function(campaignId) {
      try {
        console.log('Generating links for campaign:', campaignId);
        showToast('Generating links...', 'success');
        
        const response = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignId: campaignId, 
            action: 'generate_links',
            walletAddress: currentUser 
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showLinksModal(result);
        } else {
          showToast(result.error || 'Failed to generate links', 'error');
        }
      } catch (error) {
        console.error('Link generation error:', error);
        showToast('Failed to generate links', 'error');
      }
    };

    window.viewExistingLinks = async function(campaignId) {
      try {
        console.log('Loading existing links for campaign:', campaignId);
        showToast('Loading existing links...', 'success');
        
        const response = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignId: campaignId, 
            action: 'get_existing_links',
            walletAddress: currentUser 
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showLinksModal(result);
        } else {
          showToast(result.error || 'Failed to load existing links', 'error');
        }
      } catch (error) {
        console.error('Error loading existing links:', error);
        showToast('Failed to load existing links', 'error');
      }
    };

    window.viewStats = async function(campaignId) {
      try {
        console.log('Loading stats for campaign:', campaignId);
        showToast('Loading campaign statistics...', 'success');
        
        const response = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignId: campaignId, 
            action: 'get_stats',
            walletAddress: currentUser 
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showStatsModal(result);
        } else {
          showToast(result.error || 'Failed to load campaign stats', 'error');
        }
      } catch (error) {
        console.error('Error loading campaign stats:', error);
        showToast('Failed to load campaign stats', 'error');
      }
    };

    function showLinksModal(data) {
      console.log('Showing links modal with data:', data);
      
      // Create modal div
      const modal = document.createElement('div');
      modal.id = 'linksModal';
      modal.className = 'modal';
      modal.style.display = 'flex';
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.maxWidth = '900px';
      modalContent.style.width = '95%';
      
      // Create close button
      const closeBtn = document.createElement('span');
      closeBtn.innerHTML = '&times;';
      closeBtn.className = 'close-btn';
      closeBtn.style.cssText = 'float: right; font-size: 28px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px; border-radius: 4px;';
      closeBtn.onclick = closeLinksModal;
      
      // Create title
      const title = document.createElement('h2');
      title.innerHTML = '🔗 Generated Links';
      title.style.cssText = 'margin: 0 0 20px; color: var(--acc);';
      
      // Create campaign info
      const campaignInfo = document.createElement('div');
      campaignInfo.style.cssText = 'background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;';
      campaignInfo.innerHTML = '<h3 style="margin: 0 0 8px; color: var(--acc);">' + data.campaign.title + '</h3>' +
        '<p style="margin: 0; color: var(--muted);">Type: ' + data.campaign.type + ' • Amount: ' + data.campaign.amountPerClaim + ' tokens per claim</p>' +
        '<p style="margin: 8px 0 0; font-weight: 600; color: var(--green);">' + data.message + '</p>';
      
      // Create buttons
      const buttonsDiv = document.createElement('div');
      buttonsDiv.style.marginBottom = '16px';
      buttonsDiv.innerHTML = '<button onclick="copyAllLinks()" class="btn btn-primary" style="margin-right: 12px;">📋 Copy All Links</button>' +
        '<button onclick="downloadLinks()" class="btn">📥 Download as CSV</button>';
      
      // Create links list
      const linksList = document.createElement('div');
      linksList.style.cssText = 'max-height: 400px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;';
      
      data.links.forEach((link, index) => {
        const linkDiv = document.createElement('div');
        const bgColor = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        linkDiv.style.cssText = 'display: flex; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ' + bgColor + ';';
        
        const fullUrl = window.location.origin + link.url;
        const maxClaimsText = link.type === 'multi-claim' ? '<div style="color: var(--muted); font-size: 11px;">Max Claims: ' + link.maxClaims + '</div>' : '';
        
        linkDiv.innerHTML = '<div style="flex: 1; font-family: monospace; font-size: 13px;">' +
          '<div style="color: var(--text); margin-bottom: 4px;">ID: ' + link.id + '</div>' +
          '<div style="color: var(--acc);">URL: ' + fullUrl + '</div>' +
          maxClaimsText +
        '</div>' +
        '<button class="btn copy-link-btn" data-url="' + fullUrl + '" style="margin-left: 12px; font-size: 12px; padding: 8px 12px;">Copy</button>';
        
        linksList.appendChild(linkDiv);
      });
      
      // Add click handlers to copy buttons
      linksList.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-link-btn')) {
          const url = e.target.getAttribute('data-url');
          copyLink(url);
        }
      });
      
      // Assemble modal
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(title);
      modalContent.appendChild(campaignInfo);
      modalContent.appendChild(buttonsDiv);
      modalContent.appendChild(linksList);
      modal.appendChild(modalContent);
      
      // Add to page
      document.body.appendChild(modal);
      
      // Store links data globally for copy/download functions
      window.generatedLinksData = data;
    }

    function showStatsModal(data) {
      console.log('Showing stats modal with data:', data);
      
      // Create modal div
      const modal = document.createElement('div');
      modal.id = 'statsModal';
      modal.className = 'modal';
      modal.style.display = 'flex';
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      modalContent.style.maxWidth = '800px';
      modalContent.style.width = '95%';
      
      // Create close button
      const closeBtn = document.createElement('span');
      closeBtn.innerHTML = '&times;';
      closeBtn.className = 'close-btn';
      closeBtn.onclick = () => modal.remove();
      
      // Create title
      const title = document.createElement('h2');
      title.innerHTML = '📊 Campaign Statistics';
      title.style.cssText = 'margin: 0 0 20px; color: var(--acc);';
      
      // Create campaign info
      const campaignInfo = document.createElement('div');
      campaignInfo.style.cssText = 'background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;';
      campaignInfo.innerHTML = '<h3 style="margin: 0 0 8px; color: var(--acc);">' + data.campaign.title + '</h3>' +
        '<p style="margin: 0; color: var(--muted);">Type: ' + data.campaign.claim_type + ' • Status: ' + data.campaign.status + '</p>';
      
      // Create stats grid
      const statsGrid = document.createElement('div');
      statsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;';
      
      // Stats cards
      const statsCards = [
        { title: 'Total Budget', value: data.stats.total_budget + ' ' + data.campaign.token_symbol, color: 'var(--green)' },
        { title: 'Amount per Claim', value: data.stats.amount_per_claim + ' ' + data.campaign.token_symbol, color: 'var(--acc)' },
        { title: 'Total Claims', value: data.stats.total_claims_completed + ' / ' + data.stats.max_claims, color: 'var(--orange)' },
        { title: 'Links Generated', value: data.stats.links_count, color: 'var(--text)' },
        { title: 'Completion Rate', value: Math.round((data.stats.total_claims_completed / data.stats.max_claims) * 100) + '%', color: 'var(--green)' }
      ];
      
      statsCards.forEach(stat => {
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; text-align: center;';
        card.innerHTML = '<div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">' + stat.title + '</div>' +
          '<div style="font-size: 20px; font-weight: 600; color: ' + stat.color + ';">' + stat.value + '</div>';
        statsGrid.appendChild(card);
      });
      
      // Create claims list if there are claims
      let claimsList = document.createElement('div');
      if (data.claims && data.claims.length > 0) {
        const claimsTitle = document.createElement('h3');
        claimsTitle.innerHTML = '🎯 Recent Claims';
        claimsTitle.style.cssText = 'margin: 20px 0 12px; color: var(--acc);';
        
        claimsList.appendChild(claimsTitle);
        
        const claimsContainer = document.createElement('div');
        claimsContainer.style.cssText = 'max-height: 300px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;';
        
        data.claims.forEach((claim, index) => {
          const claimDiv = document.createElement('div');
          const bgColor = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
          claimDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ' + bgColor + ';';
          
          const walletShort = claim.wallet_address.substring(0, 6) + '...' + claim.wallet_address.substring(38);
          const timeAgo = new Date(claim.claimed_at).toLocaleDateString();
          
          claimDiv.innerHTML = '<div style="flex: 1;">' +
            '<div style="color: var(--text); font-size: 13px; margin-bottom: 2px;">💰 ' + claim.amount + ' ' + data.campaign.token_symbol + '</div>' +
            '<div style="color: var(--muted); font-size: 11px;">👤 ' + walletShort + '</div>' +
          '</div>' +
          '<div style="text-align: right;">' +
            '<div style="color: var(--muted); font-size: 11px;">' + timeAgo + '</div>' +
            '<a href="https://optimistic.etherscan.io/tx/' + claim.tx_hash + '" target="_blank" style="color: var(--acc); font-size: 11px; text-decoration: none;">🔗 TX</a>' +
          '</div>';
          
          claimsContainer.appendChild(claimDiv);
        });
        
        claimsList.appendChild(claimsContainer);
      } else {
        claimsList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">' +
          '<h3 style="color: var(--muted);">No claims yet</h3>' +
          '<p>Claims will appear here once users start claiming from your links.</p>' +
        '</div>';
      }
      
      // Assemble modal
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(title);
      modalContent.appendChild(campaignInfo);
      modalContent.appendChild(statsGrid);
      modalContent.appendChild(claimsList);
      modal.appendChild(modalContent);
      
      // Add to page
      document.body.appendChild(modal);
    }

    window.closeLinksModal = function() {
      const modal = document.getElementById('linksModal');
      if (modal) {
        modal.remove();
      }
    };

    window.copyLink = function(url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy link', 'error');
      });
    };

    window.copyAllLinks = function() {
      if (!window.generatedLinksData) return;
      
      const allLinks = window.generatedLinksData.links
        .map(link => window.location.origin + link.url)
        .join(String.fromCharCode(10));
      
      navigator.clipboard.writeText(allLinks).then(() => {
        showToast('All links copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy links', 'error');
      });
    };

    window.downloadLinks = function() {
      if (!window.generatedLinksData) return;
      
      const csvContent = 'Link ID,URL,Type,Amount,Max Claims' + String.fromCharCode(10) +
        window.generatedLinksData.links.map(link => 
          link.id + ',' + 
          window.location.origin + link.url + ',' + 
          link.type + ',' + 
          link.amount + ',' + 
          (link.maxClaims || 1)
        ).join(String.fromCharCode(10));
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign-links-' + Date.now() + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('Links downloaded as CSV!', 'success');
    };

    // Setup minimal event listeners
    window.addEventListener('load', () => {
      const createBtn = document.getElementById('createCampaignBtn');
      if (createBtn) {
        createBtn.addEventListener('click', function(e) {
          e.preventDefault();
          goToCreateCampaign();
        });
      }
    });
    
    // Reown AppKit handles all wallet interactions automatically
  </script>
</body>
</html>`);
}