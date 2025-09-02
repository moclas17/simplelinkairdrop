import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import API handlers
import generateHandler from './api/generate.js';
import claimHandler from './api/claim.js';
import claimViewHandler from './api/claim-view.js';
import dashboardHandler from './api/dashboard.js';
import loginHandler from './api/login.js';

// Wrap Vercel handlers for Express
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Root endpoint with project info
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Token Link Drop - Chingadrop.xyz</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"></div>
      <div>
        <h1>Chingadrop.xyz</h1>
        <span class="status online">🟢 Service Online</span>
      </div>
    </div>

    <div class="card">
      <h2>📋 About</h2>
      <p>A secure token distribution system using <strong>one-time claim links</strong>. Built for ERC-20 tokens with hot wallet backend integration and Supabase database management.</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="/login" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; background: linear-gradient(180deg, var(--acc), #0ea5e9); color: #0b1220; font-weight: 600; text-decoration: none; transition: all 0.2s ease;">
          🔗 Conectar con Reown
        </a>
      </div>
      
      <div class="features">
        <div class="feature">
          <h3>🔗 One-Time Links</h3>
          <p>Generate unique URLs that can only be used once to claim tokens</p>
        </div>
        <div class="feature">
          <h3>🛡️ Secure Claims</h3>
          <p>Atomic reservations prevent double-spending with automatic rollback</p>
        </div>
        <div class="feature">
          <h3>⏰ Expirable</h3>
          <p>Set custom expiration times for each batch of links</p>
        </div>
        <div class="feature">
          <h3>🔐 Admin Protected</h3>
          <p>Link generation requires admin authentication</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>🚀 API Endpoints</h2>
      
      <div class="endpoint">
        <span class="method post">POST</span>/api/generate
        <p style="margin:8px 0 0; color:var(--muted);">Generate new claim links (requires admin token)</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span>/api/claim
        <p style="margin:8px 0 0; color:var(--muted);">Process token claim from a valid link</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>/claim/:id
        <p style="margin:8px 0 0; color:var(--muted);">Claim page with user-friendly interface</p>
      </div>
    </div>

    <div class="card">
      <h2>💼 Usage Example</h2>
      <div class="endpoint">
curl -X POST ${req.get('host') ? (req.protocol + '://' + req.get('host')) : 'http://localhost:3000'}/api/generate \\<br>
&nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
&nbsp;&nbsp;-H "x-admin-token: YOUR_ADMIN_TOKEN" \\<br>
&nbsp;&nbsp;-d '{"count": 10, "amount": 50, "expiresInHours": 24}'
      </div>
    </div>

    <div class="card">
      <h2>⚙️ Configuration</h2>
      <p>System configured for:</p>
      <ul style="color:var(--muted); line-height:1.8;">
        <li><strong>Network:</strong> ${process.env.RPC_URL ? new URL(process.env.RPC_URL).hostname : 'Not configured'}</li>
        <li><strong>Token:</strong> ${process.env.TOKEN_ADDRESS || 'Not configured'}</li>
        <li><strong>Decimals:</strong> ${process.env.TOKEN_DECIMALS || 18}</li>
        <li><strong>Database:</strong> ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'Not configured'}</li>
      </ul>
    </div>

    <div style="text-align:center; color:var(--muted); margin-top:32px; font-size:14px;">
      <p>🛠️ Built with Ethers.js + Supabase + Express</p>
    </div>
  </div>
</body>
</html>`);
});

// API routes
app.use('/api/generate', wrapHandler(generateHandler));
app.use('/api/claim', wrapHandler(claimHandler));
app.use('/api/claim-view', wrapHandler(claimViewHandler));
app.use('/api/dashboard', wrapHandler(dashboardHandler));
app.use('/api/login', wrapHandler(loginHandler));
app.get('/claim/:id', (req, res) => {
  // Create a new request object with query parameter
  const modifiedReq = {
    ...req,
    query: { id: req.params.id },
    method: 'GET'
  };
  wrapHandler(claimViewHandler)(modifiedReq, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📡 API endpoints:');
  console.log('  POST http://localhost:' + PORT + '/api/generate');
  console.log('  POST http://localhost:' + PORT + '/api/claim');
  console.log('  GET  http://localhost:' + PORT + '/claim/:id');
});