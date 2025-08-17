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
    
    /* Empty state */
    .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
    .empty-state h3 { color: var(--muted); margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Wallet Connection Section -->
    <div id="walletSection" class="card wallet-section">
      <h1>🎯 Campaign Dashboard</h1>
      <p style="margin-bottom: 24px;">Connect your wallet to create and manage token distribution campaigns</p>
      
      <div id="walletStatus" style="margin-bottom: 20px;">
        <div id="noWalletMessage" class="explanation-box" style="margin-bottom: 16px; display: none;">
          ⚠️ MetaMask not detected. Please install MetaMask or another Web3 wallet to continue.
        </div>
        <div id="walletDetectedMessage" class="explanation-box" style="margin-bottom: 16px; background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); display: none;">
          ✅ MetaMask detected! Click the button below to connect your wallet.
        </div>
      </div>
      
      <button id="connectWallet" class="btn btn-primary wallet-btn">
        <svg class="metamask-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.05 8.5l-1.2-4.1c-.4-1.3-1.8-2.2-3.2-1.9L12 3.8 6.35 2.5c-1.4-.3-2.8.6-3.2 1.9L2 8.5c-.4 1.3.5 2.7 1.9 2.9l3.1.5v6.6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-6.6l3.1-.5c1.4-.2 2.3-1.6 1.9-2.9z"/>
        </svg>
        Connect Wallet
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
        <span class="close-btn" id="closeModalBtn">&times;</span>
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
              <label for="maxClaimsPerLink">Max Claims per Link <span class="label-help">(How many wallets can claim from ONE link)</span></label>
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
            <div class="budget-display">
              <div class="budget-amount"><span id="totalBudget">0</span> <span id="budgetSymbol" class="budget-symbol">TOKENS</span></div>
              <div style="font-size: 12px; color: var(--muted); margin-top: 8px;">Amount per claim × Total claims = Total budget needed</div>
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
      console.log('connectWallet function called');
      try {
        if (typeof window.ethereum !== 'undefined') {
          console.log('MetaMask detected, requesting accounts...');
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          console.log('Accounts received:', accounts);
          if (accounts.length > 0) {
            currentUser = accounts[0];
            console.log('Current user set to:', currentUser);
            showDashboard();
            loadCampaigns();
          }
        } else {
          console.log('MetaMask not detected');
          showToast('Please install MetaMask or another Web3 wallet', 'error');
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        showToast('Wallet connection failed: ' + error.message, 'error');
      }
    }

    function disconnectWallet() {
      currentUser = null;
      showWalletSection();
    }

    function showWalletSection() {
      document.getElementById('walletSection').classList.remove('hidden');
      document.getElementById('dashboardSection').classList.add('hidden');
      // Close any open modals when showing wallet section
      closeModal();
    }

    function showDashboard() {
      console.log('Showing dashboard...');
      document.getElementById('walletSection').classList.add('hidden');
      document.getElementById('dashboardSection').classList.remove('hidden');
      document.getElementById('userWallet').textContent = currentUser;
      
      // Ensure modal is closed when showing dashboard
      const modal = document.getElementById('createCampaignModal');
      console.log('Modal state check - hidden class present:', modal?.classList.contains('hidden'));
      console.log('Modal display style:', modal?.style.display);
      
      if (modal && !modal.classList.contains('hidden')) {
        console.log('FORCING modal to close - it was open when showing dashboard');
        modal.classList.add('hidden');
      } else {
        console.log('Modal is already hidden, that is correct');
      }
    }

    // Campaign management
    function openCreateCampaignModal() {
      console.log('openCreateCampaignModal called, currentUser:', currentUser);
      // Only allow opening modal if user is connected
      if (!currentUser) {
        showToast('Please connect your wallet first', 'error');
        return;
      }
      console.log('Opening create campaign modal...');
      document.getElementById('createCampaignModal').classList.remove('hidden');
    }

    function closeModal() {
      console.log('closeModal called');
      document.getElementById('createCampaignModal').classList.add('hidden');
    }

    function toggleClaimType() {
      const claimType = document.getElementById('claimType').value;
      const maxClaimsGroup = document.getElementById('maxClaimsGroup');
      
      if (claimType === 'multi') {
        maxClaimsGroup.style.display = 'block';
        // Set default value for multi-claim
        const maxClaimsInput = document.getElementById('maxClaimsPerLink');
        if (!maxClaimsInput.value) {
          maxClaimsInput.value = document.getElementById('totalClaims').value || 10;
        }
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
      try {
        const response = await fetch('/api/campaigns?walletAddress=' + currentUser);
        const data = await response.json();
        
        const grid = document.getElementById('campaignsGrid');
        
        if (data.campaigns && data.campaigns.length > 0) {
          grid.innerHTML = data.campaigns.map(function(campaign) {
            var html = '<div class="campaign-card">';
            html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">';
            html += '<h3 style="margin: 0;">' + campaign.title + '</h3>';
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
              html += '<div class="action-buttons" style="margin: 12px 0;">';
              html += '<button onclick="generateLinks(' + "'" + campaign.id + "'" + ')" class="btn btn-primary" style="margin-right: 8px; font-size: 12px;">Generate Links</button>';
              html += '<button onclick="viewStats(' + "'" + campaign.id + "'" + ')" class="btn" style="font-size: 12px;">View Stats</button>';
              html += '</div>';
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

    // Form submission handler (defined here but will be attached in load event)
    async function handleFormSubmission(e) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const campaignData = {
        walletAddress: currentUser,
        title: formData.get('title'),
        description: formData.get('description'),
        claimType: formData.get('claimType'),
        amountPerClaim: Number(formData.get('amountPerClaim')),
        totalClaims: Number(formData.get('totalClaims')),
        maxClaimsPerLink: formData.get('claimType') === 'multi' ? Number(formData.get('maxClaimsPerLink')) : null,
        tokenAddress: formData.get('tokenAddress'),
        tokenSymbol: formData.get('tokenSymbol'),
        tokenDecimals: Number(formData.get('tokenDecimals')),
        expiresInHours: formData.get('expiresInHours') ? Number(formData.get('expiresInHours')) : null
      };
      
      try {
        const submitBtn = e.target.querySelector('button[type=\"submit\"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showToast('Campaign created successfully!', 'success');
          closeModal();
          loadCampaigns();
          e.target.reset();
          calculateBudget();
        } else {
          showToast(result.error || 'Failed to create campaign', 'error');
        }
      } catch (error) {
        console.error('Campaign creation error:', error);
        showToast('Failed to create campaign', 'error');
      } finally {
        const submitBtn = e.target.querySelector('button[type=\"submit\"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Campaign';
      }
    }

    // Campaign action functions
    window.checkFunding = async function(campaignId) {
      try {
        const response = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            campaignId: campaignId, 
            action: 'check_funding',
            walletAddress: currentUser 
          })
        });
        
        const result = await response.json();
        if (response.ok) {
          if (result.funded) {
            showToast(result.message || 'Campaign activated! You can now generate links.', 'success');
            loadCampaigns(); // Refresh to show new status
          } else {
            const errorMsg = result.details || result.error || 'Funding not detected yet. Please send the required tokens first.';
            showToast(errorMsg, 'error');
          }
        } else {
          const errorMsg = result.details || result.error || 'Failed to check funding';
          showToast(errorMsg, 'error');
        }
      } catch (error) {
        console.error('Check funding error:', error);
        showToast('Failed to check funding', 'error');
      }
    };

    window.generateLinks = function(campaignId) {
      // TODO: Implement link generation modal
      showToast('Link generation coming soon!', 'success');
    };

    window.viewStats = function(campaignId) {
      // TODO: Implement stats modal
      showToast('Stats view coming soon!', 'success');
    };

    // Check wallet availability and connection on page load
    window.addEventListener('load', async () => {
      console.log('Page loaded, setting up event listeners...');
      
      // Set up all event listeners after DOM is ready
      console.log('Setting up connect wallet button...');
      const connectBtn = document.getElementById('connectWallet');
      if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
        console.log('Connect wallet event listener attached');
      } else {
        console.error('Connect wallet button not found!');
      }
      
      const disconnectBtn = document.getElementById('disconnectWallet');
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
      }
      
      const createBtn = document.getElementById('createCampaignBtn');
      if (createBtn) {
        createBtn.addEventListener('click', openCreateCampaignModal);
      }
      
      const closeBtn = document.getElementById('closeModalBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      
      // Form event listeners
      document.getElementById('amountPerClaim').addEventListener('input', calculateBudget);
      document.getElementById('totalClaims').addEventListener('input', calculateBudget);
      document.getElementById('tokenSymbol').addEventListener('input', calculateBudget);
      
      // Form submission
      document.getElementById('campaignForm').addEventListener('submit', handleFormSubmission);
      
      // Close modal when clicking outside
      document.getElementById('createCampaignModal').addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal();
        }
      });
      
      // Ensure modal is hidden on page load
      const modal = document.getElementById('createCampaignModal');
      if (modal) {
        modal.classList.add('hidden');
        console.log('Modal hidden on page load');
      }
      
      checkWalletAvailability();
      
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            currentUser = accounts[0];
            showDashboard();
            loadCampaigns();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    });
    
    function checkWalletAvailability() {
      const noWalletMsg = document.getElementById('noWalletMessage');
      const walletDetectedMsg = document.getElementById('walletDetectedMessage');
      const connectBtn = document.getElementById('connectWallet');
      
      if (typeof window.ethereum !== 'undefined') {
        noWalletMsg.style.display = 'none';
        walletDetectedMsg.style.display = 'block';
        connectBtn.style.opacity = '1';
        connectBtn.disabled = false;
      } else {
        noWalletMsg.style.display = 'block';
        walletDetectedMsg.style.display = 'none';
        connectBtn.style.opacity = '0.5';
        connectBtn.disabled = true;
      }
    }
  </script>
</body>
</html>`);
}