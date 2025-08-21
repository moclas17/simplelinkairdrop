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
  let tokenSymbol = claimData.campaigns?.token_symbol || 'TOKEN';
  const campaignTitle = claimData.campaigns?.title || 'Token Airdrop';
  const chainId = claimData.campaigns?.chain_id;
  
  // For native tokens, ensure we show the correct network symbol
  if (claimData.campaigns?.token_address === 'NATIVE' && chainId) {
    const { getNetworkInfo } = await import('../lib/networks.js');
    const networkInfo = getNetworkInfo(chainId);
    if (networkInfo) {
      tokenSymbol = networkInfo.currency;
    }
  }

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
    .btn { width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:16px 20px; border-radius:14px; border:1px solid rgba(125,211,252,0.3); background: linear-gradient(180deg, #0ea5e9, #0369a1); color:white; font-weight:600; cursor:pointer; margin-top:20px; transition: all .15s ease; font-size: 16px; }
    .btn:hover { transform: translateY(-1px); }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .hint { font-size:12px; color:#9fb0c7; margin-top:8px; }
    .toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background:#07101f; border:1px solid rgba(125,211,252,0.25); padding:10px 14px; border-radius:12px; display:none; }
    .success { color:#b5f3c1; border-color: rgba(34,197,94,0.35); background: #062313; }
    .error { color:#ffb3b3; border-color: rgba(239,68,68,0.35); background: #290d0d; }
    .logo { width:28px; height:28px; border-radius:8px; background: radial-gradient(circle at 30% 30%, #7dd3fc, #38bdf8 45%, #0ea5e9 65%, #0369a1); box-shadow: 0 0 32px #0ea5e955; }
    .progress-box { background: rgba(125,211,252,0.08); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 16px; margin: 16px 0; }
    .amount { font-size: 24px; font-weight: 700; color: var(--green); }
    .token-address { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; word-break: break-all; }
    .network-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 16px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  </style>
  <script src="../lib/networks-client.js"></script>
</head>
<body>
  <div class="card">
    <!-- App branding -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDwhLS0gR3JhZGllbnRlcyBwYXJhIGVsIHBhcmFjYcOtZGFzIC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJwYXJhY2h1dGVHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3ZGQzZmMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzOGJkZjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGVhNWU5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIEdyYWRpZW50ZSBwYXJhIGxhIGNhamEgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJveEdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZiYmYyNCIvPgogICAgICA8c3RvcCBvZmZmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjU5ZTBiIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIFNvbWJyYSBkZWwgcGFyYWNhw61kYXMgLS0+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMiIgc3RkRGV2aWF0aW9uPSIzIiBmbG9vZC1jb2xvcj0iIzBlYTVlOSIgZmxvb2Qtb3BhY2l0eT0iMC4zIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgCiAgPCEtLSBQYXJhY2HDrWRhcyBwcmluY2lwYWwgLS0+CiAgPHBhdGggZD0iTTIwIDM1IFE1MCAxNSA4MCAzNSBRNzUgNDUgNzAgNTAgTDY1IDQ1IFE1MCAyNSAzNSA0NSBMM0AgNTAgUTI1IDQ1IDIwIDM1IFoiIAogICAgICAgIGZpbGw9InVybCgjcGFyYWNodXRlR3JhZGllbnQpIiAKICAgICAgICBmaWx0ZXI9InVybCgjc2hhZG93KSIvPgogIAogIDwhLS0gTMOtbmVhcyBkZWwgcGFyYWNhw61kYXMgLS0+CiAgPHBhdGggZD0iTTI1IDQwIFE1MCAyMCA3NSA0MCIgc3Ryb2tlPSIjMDM2OWExIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNiIvPgogIDxwYXRoIGQ9Ik0zMCA0NSBRNTAgMjUgNzAgNDUiIHN0cm9rZT0iIzAzNjlhMSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjQiLz4KICA8IS0tIEN1ZXJkYXMgZGVsIHBhcmFjYcOtZGFzIC0tPgogIDxsaW5lIHgxPSIyNSIgeTE9IjQ4IiB4Mj0iNDIiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSIzOCIgeTE9IjQ4IiB4Mj0iNDYiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI2MiIgeTE9IjQ4IiB4Mj0iNTQiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI3NSIgeTE9IjQ4IiB4Mj0iNTgiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIAogIDwhLS0gQ2FqYS9wYXF1ZXRlIC0tPgogIDxyZWN0IHg9IjQyIiB5PSI3MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiByeD0iMiIgCiAgICAgICAgZmlsbD0idXJsKCNib3hHcmFkaWVudCkiIAogICAgICAgIHN0cm9rZT0iI2Q5NzcwNiIgCiAgICAgICAgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBEZXRhbGxlcyBkZSBsYSBjYWphIC0tPgogIDxsaW5lIHgxPSI0MiIgeTE9Ijc2IiB4Mj0iNTgiIHkyPSI3NiIgc3Ryb2tlPSIjZDk3NzA2IiBzdHJva2Utd2lkdGg9IjEiLz4KICA8bGluZSB4MT0iNTAiIHkxPSI3MCIgeDI9IjUwIiB5Mj0iODIiIHN0cm9rZT0iI2Q5NzcwNiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBQdW50b3MgZGUgYnJpbGxvIGVuIGVsIHBhcmFjYcOtZGFzIC0tPgogIDxjaXJjbGUgY3g9IjM1IiBjeT0iMzIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNiIvPgogIDxjaXJjbGUgY3g9IjY1IiBjeT0iMzUiIHI9IjEuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+Cjwvc3ZnPg==" alt="Chingadrop.xyz" style="width: 64px; height: 64px; margin-bottom: 12px;">
      <div style="font-size: 18px; font-weight: 700; color: var(--acc); margin-bottom: 4px;">Chingadrop.xyz</div>
      <div style="font-size: 12px; color: var(--muted);">your airdrop <em>en chinga</em> [<em>en chinga</em> = extremely fast]</div>
    </div>

    <!-- Claim info -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
        <h1 style="margin: 0; font-size: 24px;">Claim ${amount} $${tokenSymbol}</h1>
        <span id="networkBadge" class="network-badge" style="display: none;"></span>
      </div>
      <p style="margin: 0; color: var(--muted); font-size: 14px;">${campaignTitle}</p>
    </div>

    <!-- Progress indicator for multi-claim -->
    ${isMultiClaim ? `
    <div style="background: rgba(125,211,252,0.08); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 14px; font-weight: 500;">Multi-use Link</span>
        <span style="font-size: 12px; color: var(--muted);">${remainingClaims} of ${maxClaims} remaining</span>
      </div>
      <div style="width: 100%; background: rgba(0,0,0,0.2); border-radius: 4px; height: 6px;">
        <div style="width: ${(currentClaims/maxClaims)*100}%; background: var(--acc); border-radius: 4px; height: 100%; transition: width 0.3s ease;"></div>
      </div>
    </div>` : ''}

    <!-- Claim form -->
    <form id="claimForm">
      <label for="wallet">Enter your wallet address or ENS name</label>
      <input id="wallet" name="wallet" placeholder="0xabc... or vitalik.eth" required />
      <input type="hidden" id="linkId" name="linkId" />
      <button class="btn" id="submitBtn" type="submit">
        🎁 Claim ${amount} $${tokenSymbol}
      </button>
    </form>

    <!-- Divider -->
    <div style="text-align: center; margin: 32px 0; color: var(--muted); font-size: 14px; font-weight: 500;">
      — OR —
    </div>

    <!-- Porto Email Wallet Section -->
    <div style="background: rgba(125,211,252,0.05); border: 1px solid rgba(125,211,252,0.2); border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center;">
      <div style="font-size: 16px; font-weight: 600; color: var(--acc); margin-bottom: 8px;">
        📧 No tienes wallet?
      </div>
      <div style="font-size: 14px; color: var(--muted); margin-bottom: 16px;">
        Crea una con tu correo electrónico
      </div>
      <button id="createWalletBtn" class="btn" style="background: linear-gradient(135deg, var(--acc), #38bdf8); color: #0b1220; font-weight: 600;">
        ✨ Crear wallet con email
      </button>
      <div id="portoStatus" style="margin-top: 8px; font-size: 11px; color: var(--muted);">
        <span id="portoIndicator">⚡ Verificando Porto...</span>
      </div>
      <div id="emailWalletStatus" style="margin-top: 12px; font-size: 12px; color: var(--muted); display: none;"></div>
    </div>

    <!-- Footer info -->
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <div style="font-size: 12px; color: var(--muted); line-height: 1.5;">
        ${isMultiClaim ? 
          `🔄 Multi-use link • Each wallet can claim once<br>` : 
          `🔒 Single-use link • Can only be claimed once<br>`}
        ⏰ Expires: ${expiryDate}<br>
        🛡️ Secure backend transfer
      </div>
    </div>

    <div id="toast" class="toast">Processing…</div>
  </div>

  <script type="module">
    // Import Porto from ESM CDN
    import { Porto } from 'https://esm.sh/porto@0.0.76';
    
    // Check Porto service status on page load
    (async function checkPortoStatus() {
      const indicator = document.getElementById('portoIndicator');
      const createBtn = document.getElementById('createWalletBtn');
      
      try {
        // Test Porto service with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://id.porto.sh', { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        indicator.innerHTML = '🟢 Porto disponible';
        indicator.style.color = 'var(--green)';
      } catch (error) {
        indicator.innerHTML = '🔴 Porto no disponible';
        indicator.style.color = '#ef4444';
        createBtn.style.opacity = '0.6';
        createBtn.style.cursor = 'not-allowed';
        createBtn.title = 'Porto service is currently unavailable';
      }
    })();
    
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

    // Porto.sh Email Wallet Integration
    const createWalletBtn = document.getElementById('createWalletBtn');
    const emailWalletStatus = document.getElementById('emailWalletStatus');
    let portoWallet = null;

    createWalletBtn.addEventListener('click', async () => {
      try {
        createWalletBtn.disabled = true;
        createWalletBtn.textContent = 'Creando wallet...';
        emailWalletStatus.style.display = 'block';
        emailWalletStatus.textContent = 'Conectando con Porto...';

        // Check Porto service availability first
        try {
          await fetch('https://id.porto.sh', { method: 'HEAD', mode: 'no-cors' });
        } catch (connectErr) {
          throw new Error('Porto no está disponible. Servicio temporalmente fuera de línea.');
        }

        // Create wallet with Porto with timeout - simplified approach
        emailWalletStatus.textContent = 'Creando wallet segura...';
        console.log('[Porto] Attempting to create wallet...');
        
        // Simple timeout wrapper
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Porto tardó demasiado en responder (30s)')), 30000)
        );
        
        const walletPromise = new Promise(async (resolve, reject) => {
          try {
            console.log('[Porto] Calling Porto.create()...');
            
            // Porto might require user interaction, so we need to handle different scenarios
            emailWalletStatus.textContent = 'Abriendo diálogo de Porto...';
            
            const walletResult = await Porto.create();
            console.log('[Porto] Porto.create() result:', walletResult);
            console.log('[Porto] Result type:', typeof walletResult);
            
            // Check if Porto returned a dialog or requires additional steps
            if (walletResult && typeof walletResult === 'object') {
              // Check if it's a dialog that needs to be opened
              if (typeof walletResult.open === 'function') {
                console.log('[Porto] Opening Porto dialog...');
                emailWalletStatus.textContent = 'Por favor completa el proceso en la ventana de Porto...';
                const dialogResult = await walletResult.open();
                console.log('[Porto] Dialog result:', dialogResult);
                resolve(dialogResult);
              } else {
                resolve(walletResult);
              }
            } else {
              resolve(walletResult);
            }
          } catch (error) {
            console.error('[Porto] Porto.create() error:', error);
            reject(error);
          }
        });
        
        portoWallet = await Promise.race([walletPromise, timeoutPromise]);
        console.log('[Porto] Wallet object received:', portoWallet);
        console.log('[Porto] Wallet keys:', portoWallet ? Object.keys(portoWallet) : 'null');
        
        // Try different ways to get the address
        let address = null;
        if (portoWallet) {
          address = portoWallet.address || 
                   portoWallet.account?.address || 
                   portoWallet.accounts?.[0]?.address ||
                   portoWallet.wallet?.address ||
                   (typeof portoWallet.getAddress === 'function' ? await portoWallet.getAddress() : null);
        }
        
        console.log('[Porto] Extracted address:', address);

        if (!address) {
          console.error('[Porto] Failed to extract address from wallet object:', portoWallet);
          throw new Error('No se pudo obtener la dirección de la wallet. Estructura de Porto inesperada.');
        }

        // Show success and auto-fill the wallet input
        emailWalletStatus.textContent = '✅ Wallet creada: ' + address.slice(0, 6) + '...' + address.slice(-4);
        document.getElementById('wallet').value = address;
        
        // Enable the claim button and scroll to it
        createWalletBtn.textContent = '✅ Wallet creada';
        createWalletBtn.style.background = 'rgba(34,197,94,0.2)';
        createWalletBtn.style.color = 'var(--green)';
        
        // Scroll to claim form
        document.getElementById('claimForm').scrollIntoView({ behavior: 'smooth' });
        
      } catch (err) {
        console.error('Porto wallet creation error:', err);
        
        // More specific error messages
        let errorMsg = 'No se pudo crear la wallet';
        if (err.message.includes('Porto no está disponible')) {
          errorMsg = 'Porto no está disponible. Intenta más tarde o usa MetaMask.';
        } else if (err.message.includes('Timeout')) {
          errorMsg = 'Conexión lenta. Intenta de nuevo.';
        } else if (err.message.includes('Network')) {
          errorMsg = 'Problema de conexión. Verifica tu internet.';
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        emailWalletStatus.textContent = '❌ Error: ' + errorMsg;
        emailWalletStatus.innerHTML += '<br><small style="color: var(--muted); margin-top: 8px;">💡 Puedes usar MetaMask u otra wallet compatible</small>';
        
        createWalletBtn.disabled = false;
        createWalletBtn.textContent = '✨ Crear wallet con email';
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
