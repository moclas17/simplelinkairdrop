import db from '../lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) return res.status(400).send('Missing id');

  // Get claim data from database
  const claimData = await db.get(id);
  if (!claimData) {
    return res.status(404).send('Claim link not found');
  }

  // Check if expired
  if (claimData.expires_at && new Date(claimData.expires_at).getTime() <= Date.now()) {
    return res.status(400).send('Claim link has expired');
  }

  // Check if already claimed
  if (claimData.claimed) {
    return res.status(400).send('This link has already been claimed');
  }

  // Get token info from environment
  const tokenAddress = process.env.TOKEN_ADDRESS || '0x...';
  const tokenSymbol = tokenAddress === '0x029263aa1be88127f1794780d9eef453221c2f30' ? 'PULPA' : 'TOKEN';
  const amount = claimData.amount;
  const expiryDate = claimData.expires_at ? new Date(claimData.expires_at).toLocaleString() : 'No expiration';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Claim your $${tokenSymbol}</title>
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
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="logo"></div>
      <div>
        <h1>Claim your $${tokenSymbol}</h1>
        <div style="font-size:12px;color:#9fb0c7">One-time link • Secure backend transfer</div>
      </div>
    </div>

    <div class="info-box">
      <h3>🎁 Token Claim Details</h3>
      <p><strong>Amount:</strong> <span class="amount">${amount} $${tokenSymbol}</span></p>
      <p><strong>Token:</strong> <span class="token-address">${tokenAddress}</span></p>
      <p><strong>Expires:</strong> ${expiryDate}</p>
    </div>

    <p style="margin-top:16px">Enter the wallet address where you want to receive your tokens. This link can be used only once.</p>

    <form id="claimForm">
      <label for="wallet">Recipient wallet (0x…)</label>
      <input id="wallet" name="wallet" placeholder="0xabc..." required pattern="^0x[a-fA-F0-9]{40}$" />
      <input type="hidden" id="linkId" name="linkId" />
      <button class="btn" id="submitBtn" type="submit">Claim ${amount} $${tokenSymbol}</button>
      <div class="hint">We will submit a transfer from the distributor wallet once you confirm.</div>
    </form>

    <div id="toast" class="toast">Processing…</div>
  </div>

  <script>
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
      btn.disabled = true;
      show('Submitting claim…');
      try {
        const payload = { wallet: form.wallet.value, linkId: form.linkId.value };
        const res = await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data?.error || 'Transfer failed');
        show('Success! TX: ' + (data.txHash || 'pending'), 'success');
        btn.textContent = 'Already claimed';
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
