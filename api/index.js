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
  <title>Token Link Drop - SimpleLink Airdrop</title>
  <style>
    :root { --bg:#0b1220; --card:#121a2a; --muted:#7e8aa0; --text:#e6eefc; --acc:#7dd3fc; --green:#22c55e; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, Arial; background: radial-gradient(1000px 600px at 10% -10%, #1a2440, transparent), var(--bg); color: var(--text); min-height:100vh; padding:24px; }
    .container { max-width:800px; margin:0 auto; }
    .card { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:32px; margin-bottom:24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); backdrop-filter: blur(8px); }
    h1 { margin:0 0 16px; font-size: clamp(24px, 4vw, 32px); letter-spacing: 0.3px; color: var(--acc); }
    h2 { margin:24px 0 12px; font-size: 20px; color: var(--acc); }
    p { margin:0 0 16px; color: var(--muted); line-height: 1.6; }
    .endpoint { background: #0f1729; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 12px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: 600; margin-right: 12px; }
    .post { background: var(--green); color: white; }
    .get { background: var(--acc); color: #0b1220; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 24px 0; }
    .feature { background: rgba(125,211,252,0.05); border: 1px solid rgba(125,211,252,0.2); border-radius: 12px; padding: 20px; }
    .feature h3 { margin: 0 0 8px; color: var(--acc); font-size: 16px; }
    .logo { width:40px; height:40px; border-radius:12px; background: radial-gradient(circle at 30% 30%, #7dd3fc, #38bdf8 45%, #0ea5e9 65%, #0369a1); box-shadow: 0 0 32px #0ea5e955; margin-right: 16px; float: left; }
    .header { display: flex; align-items: center; margin-bottom: 24px; }
    .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .online { background: rgba(34,197,94,0.2); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: linear-gradient(180deg, #1e293b, #0f172a); color: white; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s ease; font-size: 16px; }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn-primary { background: linear-gradient(180deg, var(--acc), #0ea5e9); color: #0b1220; border-color: var(--acc); }
    .quick-access { text-align: center; margin: 24px 0; }
    .quick-access h2 { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDwhLS0gR3JhZGllbnRlcyBwYXJhIGVsIHBhcmFjYcOtZGFzIC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJwYXJhY2h1dGVHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3ZGQzZmMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzOGJkZjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGVhNWU5Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIEdyYWRpZW50ZSBwYXJhIGxhIGNhamEgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJveEdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZiYmYyNCIvPgogICAgICA8c3RvcCBvZmZmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjU5ZTBiIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgCiAgICA8IS0tIFNvbWJyYSBkZWwgcGFyYWNhw61kYXMgLS0+CiAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMiIgc3RkRGV2aWF0aW9uPSIzIiBmbG9vZC1jb2xvcj0iIzBlYTVlOSIgZmxvb2Qtb3BhY2l0eT0iMC4zIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgCiAgPCEtLSBQYXJhY2HDrWRhcyBwcmluY2lwYWwgLS0+CiAgPHBhdGggZD0iTTIwIDM1IFE1MCAxNSA4MCAzNSBRNzUgNDUgNzAgNTAgTDY1IDQ1IFE1MCAyNSAzNSA0NSBMM0AgNTAgUTI1IDQ1IDIwIDM1IFoiIAogICAgICAgIGZpbGw9InVybCgjcGFyYWNodXRlR3JhZGllbnQpIiAKICAgICAgICBmaWx0ZXI9InVybCgjc2hhZG93KSIvPgogIAogIDwhLS0gTMOtbmVhcyBkZWwgcGFyYWNhw61kYXMgLS0+CiAgPHBhdGggZD0iTTI1IDQwIFE1MCAyMCA3NSA0MCIgc3Ryb2tlPSIjMDM2OWExIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNiIvPgogIDxwYXRoIGQ9Ik0zMCA0NSBRNTAgMjUgNzAgNDUiIHN0cm9rZT0iIzAzNjlhMSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjQiLz4KICA8IS0tIEN1ZXJkYXMgZGVsIHBhcmFjYcOtZGFzIC0tPgogIDxsaW5lIHgxPSIyNSIgeTE9IjQ4IiB4Mj0iNDIiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSIzOCIgeTE9IjQ4IiB4Mj0iNDYiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI2MiIgeTE9IjQ4IiB4Mj0iNTQiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDxsaW5lIHgxPSI3NSIgeTE9IjQ4IiB4Mj0iNTgiIHkyPSI3MCIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIAogIDwhLS0gQ2FqYS9wYXF1ZXRlIC0tPgogIDxyZWN0IHg9IjQyIiB5PSI3MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiByeD0iMiIgCiAgICAgICAgZmlsbD0idXJsKCNib3hHcmFkaWVudCkiIAogICAgICAgIHN0cm9rZT0iI2Q5NzcwNiIgCiAgICAgICAgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBEZXRhbGxlcyBkZSBsYSBjYWphIC0tPgogIDxsaW5lIHgxPSI0MiIgeTE9Ijc2IiB4Mj0iNTgiIHkyPSI3NiIgc3Ryb2tlPSIjZDk3NzA2IiBzdHJva2Utd2lkdGg9IjEiLz4KICA8bGluZSB4MT0iNTAiIHkxPSI3MCIgeDI9IjUwIiB5Mj0iODIiIHN0cm9rZT0iI2Q5NzcwNiIgc3Ryb2tlLXdpZHRoPSIxIi8+CiAgCiAgPCEtLSBQdW50b3MgZGUgYnJpbGxvIGVuIGVsIHBhcmFjYcOtZGFzIC0tPgogIDxjaXJjbGUgY3g9IjM1IiBjeT0iMzIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNiIvPgogIDxjaXJjbGUgY3g9IjY1IiBjeT0iMzUiIHI9IjEuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+Cjwvc3ZnPg==" alt="SimpleLink Airdrop" class="logo-svg" style="width:48px; height:48px; margin-right:16px;">
      <div>
        <h1>SimpleLink Airdrop</h1>
        <span class="status online">🟢 Service Online</span>
      </div>
    </div>

    <div class="card quick-access">
      <h2>🚀 Get Started</h2>
      <p style="margin-bottom: 20px;">Create and manage your token distribution campaigns</p>
      <a href="/dashboard" class="btn btn-primary">
        🎯 Open Campaign Dashboard
      </a>
    </div>

    <div class="card">
      <h2>📋 About</h2>
      <p>A secure token distribution system using <strong>one-time and multi-claim links</strong>. Built for ERC-20 tokens with hot wallet backend integration, ENS support, and Supabase database management.</p>
      
      <div class="features">
        <div class="feature">
          <h3>🔗 One-Time Links</h3>
          <p>Generate unique URLs that can only be used once to claim tokens</p>
        </div>
        <div class="feature">
          <h3>🔄 Multi-Claim Links</h3>
          <p>Create links that allow multiple wallets to claim (e.g., 10 claims of 10 tokens each)</p>
        </div>
        <div class="feature">
          <h3>🏷️ Campaign System</h3>
          <p>Organize airdrops by campaigns - wallets can claim from multiple campaigns</p>
        </div>
        <div class="feature">
          <h3>🏷️ ENS Support</h3>
          <p>Users can claim using ENS names (e.g., vitalik.eth) instead of wallet addresses</p>
        </div>
        <div class="feature">
          <h3>🛡️ Secure Claims</h3>
          <p>Atomic reservations prevent double-spending with automatic rollback</p>
        </div>
        <div class="feature">
          <h3>💰 Balance Check</h3>
          <p>Pre-transfer balance verification prevents gas waste on failed transactions</p>
        </div>
        <div class="feature">
          <h3>📊 Transaction History</h3>
          <p>View claim details with direct links to blockchain explorers</p>
        </div>
        <div class="feature">
          <h3>⏰ Expirable</h3>
          <p>Set custom expiration times for each batch of links</p>
        </div>
        <div class="feature">
          <h3>🔐 Admin Protected</h3>
          <p>Link generation requires admin authentication</p>
        </div>
        <div class="feature">
          <h3>👤 User Dashboard</h3>
          <p>Web interface for users to create and manage their own campaigns</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>🚀 API Endpoints</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span>/api/generate
        <p style="margin:8px 0 0; color:var(--muted);">Generate new single-use claim links (requires admin token)</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>/api/generate-multi
        <p style="margin:8px 0 0; color:var(--muted);">Generate new multi-claim links - allows multiple wallets to claim (requires admin token)</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>/api/claim
        <p style="margin:8px 0 0; color:var(--muted);">Process token claim from a valid link (supports ENS resolution)</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>/claim/:id
        <p style="margin:8px 0 0; color:var(--muted);">Claim page with user-friendly interface, progress tracking for multi-claims</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>/dashboard
        <p style="margin:8px 0 0; color:var(--muted);">Campaign management dashboard - create and manage your own airdrops</p>
      </div>
    </div>

    <div class="card">
      <h2>💼 Usage Examples</h2>
      
      <h3 style="color:var(--acc); font-size:16px; margin:20px 0 8px;">Single-Use Claims</h3>
      <div class="endpoint">
curl -X POST ${req.headers.host ? (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host : 'https://your-app.vercel.app'}/api/generate \\<br>
&nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
&nbsp;&nbsp;-H "x-admin-token: YOUR_ADMIN_TOKEN" \\<br>
&nbsp;&nbsp;-d '{"count": 10, "amount": 50, "expiresInHours": 24, "campaign_id": "launch-airdrop"}'
      </div>
      
      <h3 style="color:var(--acc); font-size:16px; margin:20px 0 8px;">Multi-Claim Links</h3>
      <div class="endpoint">
curl -X POST ${req.headers.host ? (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host : 'https://your-app.vercel.app'}/api/generate-multi \\<br>
&nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
&nbsp;&nbsp;-H "x-admin-token: YOUR_ADMIN_TOKEN" \\<br>
&nbsp;&nbsp;-d '{"count": 1, "amount": 10, "maxClaims": 20, "expiresInHours": 48, "campaign_id": "community-rewards"}'
      </div>
      
      <h3 style="color:var(--acc); font-size:16px; margin:20px 0 8px;">Claiming with ENS</h3>
      <div class="endpoint">
• Visit /claim/:id<br>
• Enter wallet address: <strong>0xabc123...</strong> or ENS name: <strong>vitalik.eth</strong><br>
• System automatically resolves ENS to address<br>
• Balance checked before transfer to prevent gas waste
      </div>
    </div>

    <div class="card">
      <h2>⚙️ Configuration</h2>
      <p>Multi-chain system supporting:</p>
      <ul style="color:var(--muted); line-height:1.8;">
        <li><strong>🔴 Optimism:</strong> Layer 2 scaling solution (Original network)</li>
        <li><strong>🔵 Arbitrum One:</strong> Optimistic rollup with fast withdrawals</li>
        <li><strong>🔷 Base:</strong> Coinbase's Layer 2 built on OP Stack</li>
        <li><strong>📜 Scroll:</strong> zkEVM-based Layer 2 solution</li>
        <li><strong>🟫 Mantle:</strong> Modular Layer 2 with native yield</li>
        <li><strong>🟣 Monad Testnet:</strong> High-performance EVM-compatible Layer 1</li>
        <li><strong>Database:</strong> ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'Not configured'}</li>
      </ul>
    </div>

    <div class="card">
      <h2>🆕 Recent Updates</h2>
      <ul style="color:var(--muted); line-height:1.8;">
        <li><strong>🌐 Multi-Chain Support:</strong> Full support for Optimism, Arbitrum, Base, Scroll, and Mantle networks</li>
        <li><strong>🎯 Network Detection:</strong> Automatic detection of connected wallet network with real-time updates</li>
        <li><strong>⚙️ Dynamic RPCs:</strong> Smart routing to correct RPC endpoints based on campaign network</li>
        <li><strong>Campaign System:</strong> Organize airdrops by campaigns - wallets can participate in multiple campaigns</li>
        <li><strong>Multi-Claim Links:</strong> Create links that allow multiple different wallets to claim</li>
        <li><strong>ENS Resolution:</strong> Users can claim using ENS names like vitalik.eth</li>
        <li><strong>Balance Verification:</strong> Pre-transfer checks prevent failed transactions and gas waste</li>
        <li><strong>Transaction History:</strong> Already-claimed errors show transaction hash and explorer links</li>
      </ul>
    </div>
    
    <div class="card">
      <h2>🙏 Credits & Acknowledgments</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div style="text-align: center; padding: 16px;">
          <h3 style="color: var(--acc); margin: 0 0 8px; font-size: 16px;">🤖 Development</h3>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>Claude Code</strong><br>AI-powered development</p>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>ChatGPT</strong><br>AI assistance & optimization</p>
        </div>
        <div style="text-align: center; padding: 16px;">
          <h3 style="color: var(--acc); margin: 0 0 8px; font-size: 16px;">🌐 Community</h3>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>criptochingaderas.com</strong><br>Web3 education & resources</p>
        </div>
        <div style="text-align: center; padding: 16px;">
          <h3 style="color: var(--acc); margin: 0 0 8px; font-size: 16px;">⚡ Technology</h3>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>Ethers.js</strong><br>Blockchain interaction</p>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>Supabase</strong><br>Database & backend</p>
          <p style="margin: 4px 0; color: var(--muted); font-size: 14px;"><strong>Vercel</strong><br>Deployment platform</p>
        </div>
      </div>
    </div>
    
    <div style="text-align:center; color:var(--muted); margin-top:32px; font-size:14px;">
      <p>🛠️ Developed with AI assistance • ENS Resolution • Multi-Chain Support</p>
      <p style="margin-top: 8px; font-size: 12px;">Special thanks to <strong>criptochingaderas.com</strong> for Web3 education and community support</p>
    </div>
  </div>
</body>
</html>`);
}