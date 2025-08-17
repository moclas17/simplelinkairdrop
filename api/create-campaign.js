export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get wallet address from query
  const { wallet } = req.query;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Campaign - SimpleLink Airdrop</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --green:#22c55e; --red:#ef4444; --orange:#f59e0b; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; padding:24px; }
    .container { max-width:800px; margin:0 auto; }
    .card { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:32px; margin-bottom:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
    h1 { margin:0 0 16px; font-size: clamp(24px, 4vw, 32px); letter-spacing: 0.3px; color: var(--acc); }
    h2 { margin:24px 0 12px; font-size: 20px; color: var(--acc); }
    p { margin:0 0 16px; color: var(--muted); line-height: 1.6; }
    
    /* Buttons */
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, #1e293b, #0f172a); color:white; font-weight:600; cursor:pointer; text-decoration:none; transition: all 0.2s ease; min-height: 44px; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: linear-gradient(180deg, var(--acc), #0ea5e9); color: #0b1220; border-color: var(--acc); }
    .btn-success { background: linear-gradient(180deg, var(--green), #16a34a); border-color: var(--green); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    
    /* Forms */
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
    
    /* Toast */
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; border-radius: 12px; font-weight: 500; z-index: 1001; box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .toast-success { background: var(--green); color: white; }
    .toast-error { background: var(--red); color: white; }
    
    /* Header with back button */
    .header { display: flex; align-items: center; margin-bottom: 24px; }
    .back-btn { margin-right: 16px; }
    .wallet-info { background: rgba(125,211,252,0.08); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .wallet-address { font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; color: var(--acc); }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <a href="/dashboard" class="btn back-btn">← Back to Dashboard</a>
      <h1>🎯 Create New Campaign</h1>
    </div>

    <!-- Wallet Info -->
    <div class="wallet-info">
      <strong>Connected Wallet:</strong> <span class="wallet-address" id="userWallet">${wallet || 'Not connected'}</span>
    </div>

    <!-- Campaign Form -->
    <div class="card">
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
            <div class="explanation-box" id="claimTypeExplanation" style="margin-top: 8px;">
              🔗 <strong>Single-use:</strong> Creates multiple links, each can be claimed once.<br>
              🔗 <strong>Multi-claim:</strong> Creates ONE link that multiple wallets can claim from.
            </div>
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
            <label for="maxClaimsPerLink">Max Claims per Link <span class="label-help">(For multi-claim: ignored - determined by total claims)</span></label>
            <input type="number" id="maxClaimsPerLink" name="maxClaimsPerLink" placeholder="10" min="1" readonly style="opacity: 0.6;">
            <div class="explanation-box" id="multiClaimExplanation" style="margin-top: 8px;">
              📋 <strong>Multi-claim explanation:</strong> Creates ONE link that allows multiple different wallets to claim. Each wallet can only claim once. Total claims = how many different wallets can claim from this single link.
            </div>
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
          <a href="/dashboard" class="btn">Cancel</a>
          <button type="submit" class="btn btn-success">Create Campaign</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const walletAddress = urlParams.get('wallet') || '${wallet}';
    
    // Update wallet display
    if (walletAddress && walletAddress !== 'null') {
      document.getElementById('userWallet').textContent = walletAddress;
    } else {
      // Redirect to dashboard if no wallet
      window.location.href = '/dashboard';
    }

    function toggleClaimType() {
      const claimType = document.getElementById('claimType').value;
      const maxClaimsGroup = document.getElementById('maxClaimsGroup');
      const totalClaimsLabel = document.querySelector('label[for="totalClaims"]');
      
      if (claimType === 'multi') {
        maxClaimsGroup.style.display = 'block';
        // For multi-claim, max claims per link equals total claims (since there's only 1 link)
        const totalClaims = document.getElementById('totalClaims').value || 10;
        const maxClaimsInput = document.getElementById('maxClaimsPerLink');
        maxClaimsInput.value = totalClaims;
        
        // Update the Total Claims label to be clearer
        totalClaimsLabel.innerHTML = 'Total Claims <span class="label-help">(How many different wallets can claim from the link)</span>';
      } else {
        maxClaimsGroup.style.display = 'none';
        // Reset the Total Claims label for single-use
        totalClaimsLabel.innerHTML = 'Total Claims <span class="label-help">(How many single-use links to create)</span>';
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

    function showToast(message, type) {
      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }

    // Event listeners
    document.getElementById('amountPerClaim').addEventListener('input', calculateBudget);
    document.getElementById('totalClaims').addEventListener('input', function() {
      calculateBudget();
      // Update max claims per link for multi-claim mode
      if (document.getElementById('claimType').value === 'multi') {
        document.getElementById('maxClaimsPerLink').value = this.value;
      }
    });
    document.getElementById('tokenSymbol').addEventListener('input', calculateBudget);

    // Form submission
    document.getElementById('campaignForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!walletAddress || walletAddress === 'null') {
        showToast('Wallet address required', 'error');
        return;
      }
      
      const formData = new FormData(e.target);
      const campaignData = {
        walletAddress: walletAddress,
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
        const submitBtn = e.target.querySelector('button[type="submit"]');
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
          setTimeout(() => {
            window.location.href = '/dashboard?wallet=' + walletAddress;
          }, 1500);
        } else {
          showToast(result.error || 'Failed to create campaign', 'error');
        }
      } catch (error) {
        console.error('Campaign creation error:', error);
        showToast('Failed to create campaign', 'error');
      } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Campaign';
      }
    });

    // Initialize budget calculation
    calculateBudget();
  </script>
</body>
</html>`);
}