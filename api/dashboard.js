export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Dashboard - SimpleLink Airdrop</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --green:#22c55e; --red:#ef4444; --orange:#f59e0b; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; padding:24px; }
    .container { max-width:1200px; margin:0 auto; }
    .card { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:32px; margin-bottom:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
    h1 { margin:0 0 16px; font-size: clamp(24px, 4vw, 32px); letter-spacing: 0.3px; color: var(--acc); }
    h2 { margin:24px 0 12px; font-size: 20px; color: var(--acc); }
    p { margin:0 0 16px; color: var(--muted); line-height: 1.6; }
    .btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, #1e293b, #0f172a); color:white; font-weight:600; cursor:pointer; text-decoration:none; transition: transform .04s ease; }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: linear-gradient(180deg, var(--acc), #0ea5e9); color: #0b1220; }
    .btn-success { background: linear-gradient(180deg, var(--green), #16a34a); }
    .btn-danger { background: linear-gradient(180deg, var(--red), #dc2626); }
    .wallet-section { text-align: center; padding: 40px 20px; }
    .wallet-btn { font-size: 18px; padding: 16px 32px; }
    .user-info { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(125,211,252,0.05); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; margin-bottom: 24px; }
    .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .campaign-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; }
    .status { padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
    .status-draft { background: rgba(126,138,160,0.2); color: var(--muted); }
    .status-pending { background: rgba(245,158,11,0.2); color: var(--orange); }
    .status-active { background: rgba(34,197,94,0.2); color: var(--green); }
    .status-completed { background: rgba(34,197,94,0.3); color: var(--green); }
    .hidden { display: none; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: var(--text); font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; background: #0f1729; color: var(--text); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--acc); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 32px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .close-btn { float: right; font-size: 24px; cursor: pointer; color: var(--muted); }
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; border-radius: 12px; font-weight: 500; z-index: 1001; }
    .toast-success { background: var(--green); color: white; }
    .toast-error { background: var(--red); color: white; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Wallet Connection Section -->
    <div id="walletSection" class="card wallet-section">
      <h1>🎯 Campaign Dashboard</h1>
      <p>Connect your wallet to create and manage token distribution campaigns</p>
      <button id="connectWallet" class="btn btn-primary wallet-btn">
        🔐 Connect Wallet
      </button>
    </div>

    <!-- Dashboard Section (hidden initially) -->
    <div id="dashboardSection" class="hidden">
      <!-- User Info -->
      <div class="user-info">
        <div>
          <strong>Connected Wallet:</strong> <span id="userWallet">-</span>
        </div>
        <button id="disconnectWallet" class="btn btn-danger">Disconnect</button>
      </div>

      <!-- Actions -->
      <div class="card">
        <h2>📊 Your Campaigns</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <p>Create and manage your token distribution campaigns</p>
          <button id="createCampaignBtn" class="btn btn-primary">
            ➕ Create Campaign
          </button>
        </div>
        
        <div id="campaignsGrid" class="campaigns-grid">
          <!-- Campaigns will be loaded here -->
        </div>
      </div>
    </div>

    <!-- Create Campaign Modal -->
    <div id="createCampaignModal" class="modal hidden">
      <div class="modal-content">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <h2>🎯 Create New Campaign</h2>
        <form id="campaignForm">
          <div class="form-group">
            <label for="campaignTitle">Campaign Title</label>
            <input type="text" id="campaignTitle" name="title" placeholder="e.g., Community Airdrop 2024" required>
          </div>

          <div class="form-group">
            <label for="campaignDescription">Description</label>
            <textarea id="campaignDescription" name="description" placeholder="Describe your campaign..." rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="claimType">Claim Type</label>
              <select id="claimType" name="claimType" onchange="toggleClaimType()" required>
                <option value="single">Single-use Claims</option>
                <option value="multi">Multi-claim Links</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amountPerClaim">Amount per Claim</label>
              <input type="number" id="amountPerClaim" name="amountPerClaim" placeholder="100" step="0.01" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="totalClaims">Total Claims</label>
              <input type="number" id="totalClaims" name="totalClaims" placeholder="1000" min="1" required>
            </div>
            <div class="form-group" id="maxClaimsGroup" style="display: none;">
              <label for="maxClaimsPerLink">Max Claims per Link</label>
              <input type="number" id="maxClaimsPerLink" name="maxClaimsPerLink" placeholder="10" min="1">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tokenAddress">Token Contract</label>
              <input type="text" id="tokenAddress" name="tokenAddress" placeholder="0x..." pattern="^0x[a-fA-F0-9]{40}$" required>
            </div>
            <div class="form-group">
              <label for="tokenSymbol">Token Symbol</label>
              <input type="text" id="tokenSymbol" name="tokenSymbol" placeholder="TOKEN" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tokenDecimals">Token Decimals</label>
              <input type="number" id="tokenDecimals" name="tokenDecimals" value="18" min="0" max="18" required>
            </div>
            <div class="form-group">
              <label for="expiresInHours">Expires in Hours (optional)</label>
              <input type="number" id="expiresInHours" name="expiresInHours" placeholder="72" min="1">
            </div>
          </div>

          <div class="form-group">
            <label>Total Budget Required</label>
            <div style="padding: 12px; background: rgba(125,211,252,0.1); border-radius: 8px; font-weight: 600;">
              <span id="totalBudget">0</span> <span id="budgetSymbol">TOKENS</span>
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="button" onclick="closeModal()" class="btn">Cancel</button>
            <button type="submit" class="btn btn-success">Create Campaign</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    let currentUser = null;

    // Wallet connection
    async function connectWallet() {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          if (accounts.length > 0) {
            currentUser = accounts[0];
            showDashboard();
            loadCampaigns();
          }
        } else {
          showToast('Please install MetaMask or another Web3 wallet', 'error');
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        showToast('Wallet connection failed', 'error');
      }
    }

    function disconnectWallet() {
      currentUser = null;
      showWalletSection();
    }

    function showWalletSection() {
      document.getElementById('walletSection').classList.remove('hidden');
      document.getElementById('dashboardSection').classList.add('hidden');
    }

    function showDashboard() {
      document.getElementById('walletSection').classList.add('hidden');
      document.getElementById('dashboardSection').classList.remove('hidden');
      document.getElementById('userWallet').textContent = currentUser;
    }

    // Campaign management
    function openCreateCampaignModal() {
      document.getElementById('createCampaignModal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('createCampaignModal').classList.add('hidden');
    }

    function toggleClaimType() {
      const claimType = document.getElementById('claimType').value;
      const maxClaimsGroup = document.getElementById('maxClaimsGroup');
      
      if (claimType === 'multi') {
        maxClaimsGroup.style.display = 'block';
      } else {
        maxClaimsGroup.style.display = 'none';
      }
      
      calculateBudget();
    }

    function calculateBudget() {
      const amount = parseFloat(document.getElementById('amountPerClaim').value) || 0;
      const totalClaims = parseInt(document.getElementById('totalClaims').value) || 0;
      const symbol = document.getElementById('tokenSymbol').value || 'TOKENS';
      
      const budget = amount * totalClaims;
      document.getElementById('totalBudget').textContent = budget.toLocaleString();
      document.getElementById('budgetSymbol').textContent = symbol;
    }

    async function loadCampaigns() {
      // TODO: Implement API call to load user campaigns
      console.log('Loading campaigns for user:', currentUser);
    }

    function showToast(message, type) {
      const toast = document.createElement('div');
      toast.className = \`toast toast-\${type}\`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }

    // Event listeners
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
    document.getElementById('createCampaignBtn').addEventListener('click', openCreateCampaignModal);
    
    // Form event listeners
    document.getElementById('amountPerClaim').addEventListener('input', calculateBudget);
    document.getElementById('totalClaims').addEventListener('input', calculateBudget);
    document.getElementById('tokenSymbol').addEventListener('input', calculateBudget);

    // Close modal when clicking outside
    document.getElementById('createCampaignModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });

    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            currentUser = accounts[0];
            showDashboard();
            loadCampaigns();
          }
        });
    }
  </script>
</body>
</html>`);
}