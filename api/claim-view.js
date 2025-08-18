import db from '../lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) return res.status(400).send('Missing id');

  // Get claim data with campaign info from database
  const claimData = await db.getClaimWithCampaignInfo(id);
  if (!claimData) {
    return res.status(404).send(getErrorPage('Link Not Found', '🔍 This claim link does not exist or may have been removed.', 'The link you\'re trying to access is invalid or may have been deleted.'));
  }

  // Extract token info from campaign
  const tokenSymbol = claimData.campaigns?.token_symbol || 'TOKEN';
  const tokenAddress = claimData.campaigns?.token_address;
  const campaignTitle = claimData.campaigns?.title || 'Token Airdrop';
  const chainId = claimData.campaigns?.chain_id;

  // Check if expired
  if (claimData.expires_at && new Date(claimData.expires_at).getTime() <= Date.now()) {
    const expiredDate = new Date(claimData.expires_at).toLocaleString();
    return res.status(400).send(getErrorPage('Link Expired', `⏰ This ${claimData.amount} $${tokenSymbol} claim link has expired.`, `This link expired on ${expiredDate}. Please contact the distributor for a new link.`));
  }

  // Handle multi-claim vs single-claim display logic
  if (claimData.is_multi_claim) {
    // For multi-claim links, check if max claims reached
    if (claimData.current_claims >= claimData.max_claims) {
      return res.status(400).send(getMultiClaimCompletePage(claimData.amount, tokenSymbol, claimData.max_claims, claimData.current_claims));
    }
  } else {
    // Check if single-use claim is already claimed
    if (claimData.claimed) {
      const claimedDate = claimData.claimed_at ? new Date(claimData.claimed_at).toLocaleString() : 'Unknown date';
      const txHash = claimData.tx_hash;
      return res.status(400).send(getAlreadyClaimedPage(claimData.amount, tokenSymbol, claimedDate, txHash));
    }
  }

  const amount = claimData.amount;
  const expiryDate = claimData.expires_at ? new Date(claimData.expires_at).toLocaleString() : 'No expiration';
  
  // Multi-claim specific data
  const isMultiClaim = claimData.is_multi_claim;
  const maxClaims = claimData.max_claims || 1;
  const currentClaims = claimData.current_claims || 0;
  const remainingClaims = maxClaims - currentClaims;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Claim ${tokenSymbol} - ${campaignTitle}</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --green:#22c55e; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; display:grid; place-items:center; padding:24px; }
    .card { width:100%; max-width:520px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
    h1 { margin:0 0 6px; font-size: clamp(22px, 3.5vw, 28px); letter-spacing: 0.3px; }
    p { margin:0 0 18px; color: var(--muted); }
    label { display:block; font-size:14px; color:#a9b5cc; margin:16px 0 8px; }
    input { width:100%; padding:14px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.12); background:#0f1729; color:var(--text); outline:none; font-size:16px; }
    input:focus { border-color: var(--acc); box-shadow: 0 0 0 3px rgba(125,211,252,0.15); }
    .btn { width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:14px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, #1e293b, #0f172a); color:white; font-weight:600; cursor:pointer; margin-top:18px; transition: transform .04s ease; }
    .btn:hover { transform: translateY(-1px); }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .hint { font-size:12px; color:#9fb0c7; margin-top:8px; }
    .toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background:#07101f; border:1px solid rgba(125,211,252,0.25); padding:10px 14px; border-radius:12px; display:none; }
    .success { color:#b5f3c1; border-color: rgba(34,197,94,0.35); background: #062313; }
    .error { color:#ffb3b3; border-color: rgba(239,68,68,0.35); background: #290d0d; }
    .logo { width:28px; height:28px; border-radius:8px; background: radial-gradient(circle at 30% 30%, #7dd3fc, #38bdf8 45%, #0ea5e9 65%, #0369a1); box-shadow: 0 0 32px #0ea5e955; }
    .info-box { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 16px; margin: 16px 0; }
    .info-box h3 { margin: 0 0 8px; color: var(--green); font-size: 16px; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .amount { font-size: 24px; font-weight: 700; color: var(--green); }
    .token-address { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; word-break: break-all; }
    .network-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 16px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  </style>
  <script src="../lib/networks-client.js"></script>
</head>
<body>
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="logo"></div>
      <div>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <h1 style="margin: 0;">Claim $${tokenSymbol}</h1>
          <span id="networkBadge" class="network-badge" style="display: none;"></span>
        </div>
        <p style="margin: 0 0 16px; color: var(--muted); font-size: 14px;">${campaignTitle}</p>
        <div style="font-size:12px;color:#9fb0c7">${isMultiClaim ? `Multi-claim link • ${remainingClaims}/${maxClaims} claims remaining` : 'One-time link'} • Secure backend transfer</div>
      </div>
    </div>

    <div class="info-box">
      <h3>🎁 Token Claim Details</h3>
      <p><strong>Amount:</strong> <span class="amount">${amount} $${tokenSymbol}</span></p>
      <p><strong>Token:</strong> <span class="token-address">${tokenAddress}</span></p>
      <p><strong>Expires:</strong> ${expiryDate}</p>
      ${isMultiClaim ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p><strong>Claim Type:</strong> Multi-use link</p>
        <p><strong>Remaining Claims:</strong> ${remainingClaims} of ${maxClaims}</p>
        <div style="background: rgba(125,211,252,0.1); border-radius: 8px; padding: 8px; margin-top: 8px;">
          <div style="width: 100%; background: rgba(0,0,0,0.2); border-radius: 4px; height: 6px;">
            <div style="width: ${(currentClaims/maxClaims)*100}%; background: var(--acc); border-radius: 4px; height: 100%; transition: width 0.3s ease;"></div>
          </div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 4px; text-align: center;">${currentClaims}/${maxClaims} claimed (${Math.round((currentClaims/maxClaims)*100)}%)</div>
        </div>
      </div>` : ''}
    </div>

    <p style="margin-top:16px">Enter the wallet address or ENS name where you want to receive your tokens. ${isMultiClaim ? `Each wallet can claim only once from this multi-use link (${remainingClaims} claims remaining).` : 'This link can be used only once.'}</p>

    <form id="claimForm">
      <label for="wallet">Recipient wallet (0x… or ENS)</label>
      <input id="wallet" name="wallet" placeholder="0xabc... or vitalik.eth" required />
      <input type="hidden" id="linkId" name="linkId" />
      <button class="btn" id="submitBtn" type="submit">Claim ${amount} $${tokenSymbol} ${isMultiClaim ? `(${remainingClaims} left)` : ''}</button>
      <div class="hint">We will submit a transfer from the distributor wallet once you confirm. ${isMultiClaim ? 'Each wallet can only claim once.' : ''}</div>
    </form>

    <div id="toast" class="toast">Processing…</div>
  </div>

  <script>
    // Set up network badge
    (function(){
      const chainId = ${chainId || 'null'};
      if (chainId && typeof getNetworkInfo === 'function') {
        const networkInfo = getNetworkInfo(chainId);
        if (networkInfo) {
          const badge = document.getElementById('networkBadge');
          const textColor = isLightColor(chainId) ? '#000' : '#fff';
          badge.style.backgroundColor = networkInfo.color;
          badge.style.color = textColor;
          badge.innerHTML = networkInfo.icon + ' ' + networkInfo.name;
          badge.style.display = 'inline-flex';
        }
      }
    })();

    // Fill hidden linkId from /claim/:id
    (function(){
      const parts = location.pathname.split('/');
      const id = parts[parts.length - 1];
      document.getElementById('linkId').value = id;
    })();

    const form = document.getElementById('claimForm');
    const toast = document.getElementById('toast');
    const btn = document.getElementById('submitBtn');

    function show(msg, type) {
      toast.textContent = msg;
      toast.className = 'toast ' + (type || '');
      toast.style.display = 'block';
      setTimeout(()=> toast.style.display = 'none', 4500);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      
      const walletValue = form.wallet.value.trim();
      
      // Basic validation
      if (!walletValue) {
        show('Please enter a wallet address or ENS name', 'error');
        return;
      }
      
      // Check if it's a valid format (hex address or ENS)
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletValue);
      const isValidENS = walletValue.endsWith('.eth') && walletValue.length > 4;
      
      if (!isValidAddress && !isValidENS) {
        show('Please enter a valid 0x address or .eth ENS name', 'error');
        return;
      }
      
      btn.disabled = true;
      
      if (isValidENS) {
        show('Resolving ENS name…');
      } else {
        show('Submitting claim…');
      }
      
      try {
        const payload = { wallet: walletValue, linkId: form.linkId.value };
        const res = await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) {
          // Handle special case for already claimed with transaction details
          if (data && data.error === 'Wallet already claimed from this link' && data.details) {
            const details = data.details;
            
            // Create a nice message with clickable link
            const message = 'Already claimed! Amount: ' + details.amount + ' tokens on ' + details.claimedAt + '. TX: ' + details.txHash;
            show(message, 'error');
            btn.textContent = 'Already claimed';
            
            // Add clickable link below the form
            const linkDiv = document.createElement('div');
            linkDiv.style.cssText = 'margin-top: 16px; padding: 12px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; text-align: center;';
            linkDiv.innerHTML = '<a href="' + details.explorerUrl + '" target="_blank" style="color: var(--green); text-decoration: none; font-weight: 600;">🔍 View transaction on explorer</a>';
            
            // Insert after the form
            document.getElementById('claimForm').parentNode.insertBefore(linkDiv, document.getElementById('claimForm').nextSibling);
            return;
          }
          throw new Error((data && data.error) || 'Transfer failed');
        }
        show('Success! TX: ' + (data.txHash || 'pending'), 'success');
        btn.textContent = 'Already claimed';
        
        // For multi-claim links, reload page after 2 seconds to show updated counter
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        console.error(err);
        show(err.message || 'Error', 'error');
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`);
}

function getErrorPage(title, message, description) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - Token Claim</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --red:#ef4444; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; display:grid; place-items:center; padding:24px; }
    .card { width:100%; max-width:520px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); text-align:center; }
    h1 { margin:0 0 16px; font-size: clamp(22px, 3.5vw, 28px); letter-spacing: 0.3px; color: var(--red); }
    p { margin:0 0 18px; color: var(--muted); line-height: 1.6; }
    .message { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .logo { width:40px; height:40px; border-radius:12px; background: radial-gradient(circle at 30% 30%, #ef4444, #dc2626 45%, #b91c1c 65%, #991b1b); box-shadow: 0 0 32px #ef444455; margin: 0 auto 16px; }
    .back-btn { display: inline-block; padding: 12px 24px; background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; color: var(--acc); text-decoration: none; margin-top: 20px; transition: all 0.2s; }
    .back-btn:hover { background: rgba(125,211,252,0.2); transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"></div>
    <h1>${title}</h1>
    <div class="message">
      <p style="font-size: 18px; margin-bottom: 12px; color: var(--text);">${message}</p>
      <p style="margin: 0; font-size: 14px;">${description}</p>
    </div>
    <a href="/" class="back-btn">← Back to Home</a>
  </div>
</body>
</html>`;
}

function getMultiClaimCompletePage(amount, tokenSymbol, maxClaims, currentClaims) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>All Claims Used - $${tokenSymbol} Multi-Claim</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --orange:#f59e0b; --green:#22c55e; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; display:grid; place-items:center; padding:24px; }
    .card { width:100%; max-width:520px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); text-align:center; }
    h1 { margin:0 0 16px; font-size: clamp(22px, 3.5vw, 28px); letter-spacing: 0.3px; color: var(--orange); }
    p { margin:0 0 18px; color: var(--muted); line-height: 1.6; }
    .complete-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 20px; font-weight: 700; color: var(--green); margin: 8px 0; }
    .logo { width:40px; height:40px; border-radius:12px; background: radial-gradient(circle at 30% 30%, #f59e0b, #d97706 45%, #b45309 65%, #92400e); box-shadow: 0 0 32px #f59e0b55; margin: 0 auto 16px; }
    .stats { font-size: 14px; margin: 12px 0; }
    .progress-bar { width: 100%; background: rgba(0,0,0,0.2); border-radius: 4px; height: 8px; margin: 12px 0; }
    .progress-fill { width: 100%; background: var(--green); border-radius: 4px; height: 100%; }
    .back-btn { display: inline-block; padding: 12px 24px; background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; color: var(--acc); text-decoration: none; margin-top: 20px; transition: all 0.2s; }
    .back-btn:hover { background: rgba(125,211,252,0.2); transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"></div>
    <h1>🚫 All Claims Used</h1>
    <div class="complete-box">
      <p style="font-size: 18px; margin-bottom: 8px; color: var(--text);">📦 This multi-claim link has reached its limit!</p>
      <div class="amount">${amount} $${tokenSymbol} per claim</div>
      <div class="progress-bar"><div class="progress-fill"></div></div>
      <div class="stats"><strong>Claims completed:</strong> ${currentClaims}/${maxClaims} (100%)</div>
      <div class="stats"><strong>Total distributed:</strong> ${amount * maxClaims} $${tokenSymbol}</div>
    </div>
    <p style="color: var(--muted); font-size: 14px;">All available claims from this multi-use link have been successfully processed. Each wallet could claim only once.</p>
    <a href="/" class="back-btn">← Back to Home</a>
  </div>
</body>
</html>`;
}

function getAlreadyClaimedPage(amount, tokenSymbol, claimedDate, txHash) {
  const explorerUrl = process.env.RPC_URL?.includes('optimism') ? 
    `https://optimistic.etherscan.io/tx/${txHash}` : 
    `https://etherscan.io/tx/${txHash}`;
    
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Already Claimed - $${tokenSymbol} Tokens</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --orange:#f59e0b; --green:#22c55e; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; display:grid; place-items:center; padding:24px; }
    .card { width:100%; max-width:520px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); text-align:center; }
    h1 { margin:0 0 16px; font-size: clamp(22px, 3.5vw, 28px); letter-spacing: 0.3px; color: var(--orange); }
    p { margin:0 0 18px; color: var(--muted); line-height: 1.6; }
    .claimed-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: 700; color: var(--green); margin: 8px 0; }
    .logo { width:40px; height:40px; border-radius:12px; background: radial-gradient(circle at 30% 30%, #f59e0b, #d97706 45%, #b45309 65%, #92400e); box-shadow: 0 0 32px #f59e0b55; margin: 0 auto 16px; }
    .info-item { margin: 12px 0; font-size: 14px; }
    .info-item strong { color: var(--text); }
    .tx-link { display: inline-block; padding: 8px 16px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; color: var(--green); text-decoration: none; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; word-break: break-all; transition: all 0.2s; }
    .tx-link:hover { background: rgba(34,197,94,0.2); }
    .back-btn { display: inline-block; padding: 12px 24px; background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; color: var(--acc); text-decoration: none; margin-top: 20px; transition: all 0.2s; }
    .back-btn:hover { background: rgba(125,211,252,0.2); transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"></div>
    <h1>✅ Already Claimed</h1>
    <div class="claimed-box">
      <p style="font-size: 18px; margin-bottom: 8px; color: var(--text);">🎉 This claim has been successfully processed!</p>
      <div class="amount">${amount} $${tokenSymbol}</div>
      <div class="info-item"><strong>Claimed on:</strong> ${claimedDate}</div>
      ${txHash ? `<div class="info-item"><strong>Transaction:</strong><br><a href="${explorerUrl}" target="_blank" class="tx-link">${txHash}</a></div>` : ''}
    </div>
    <p style="color: var(--muted); font-size: 14px;">The tokens have been transferred to the recipient wallet. Each claim link can only be used once for security.</p>
    <a href="/" class="back-btn">← Back to Home</a>
  </div>
</body>
</html>`;
}
