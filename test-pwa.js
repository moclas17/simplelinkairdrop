// Simple PWA test server with HTTPS
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test route for PWA
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chingadrop PWA Test</title>
      
      <!-- PWA Meta Tags -->
      <meta name="theme-color" content="#7dd3fc">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="default">
      <meta name="apple-mobile-web-app-title" content="Chingadrop">
      <meta name="description" content="Test PWA functionality">
      
      <!-- PWA Icons -->
      <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg">
      <link rel="apple-touch-icon" href="/icons/icon-152x152.svg">
      
      <!-- PWA Manifest -->
      <link rel="manifest" href="/manifest.json">
      
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0b1220, #1a2440);
          color: white;
          padding: 40px;
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          max-width: 400px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #7dd3fc, #0369a1);
          border-radius: 20px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
        }
        h1 {
          margin: 0 0 10px;
          color: #7dd3fc;
        }
        .status {
          margin: 20px 0;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
        }
        .ready { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .install-btn {
          background: #7dd3fc;
          color: #0b1220;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          margin: 10px;
        }
        .install-btn:hover {
          background: #38bdf8;
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">💎</div>
        <h1>Chingadrop PWA</h1>
        <p>Test de funcionalidad PWA</p>
        
        <div id="pwaStatus" class="status">
          🔄 Verificando PWA...
        </div>
        
        <button id="installBtn" class="install-btn" style="display: none;">
          📱 Instalar App
        </button>
        
        <div style="margin-top: 30px;">
          <a href="/claim/test" style="color: #7dd3fc; text-decoration: none;">
            🔗 Probar página de claim
          </a>
        </div>
      </div>

      <script>
        // PWA Status Check
        function checkPWASupport() {
          const status = document.getElementById('pwaStatus');
          
          if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
            status.className = 'status ready';
            status.textContent = '✅ PWA totalmente compatible';
          } else if ('serviceWorker' in navigator) {
            status.className = 'status ready';  
            status.textContent = '✅ Service Worker disponible';
          } else {
            status.className = 'status error';
            status.textContent = '❌ PWA no compatible en este navegador';
          }
        }

        // Register Service Worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('SW registered:', registration);
            })
            .catch(error => {
              console.log('SW registration failed:', error);
            });
        }

        // Install Prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          deferredPrompt = e;
          document.getElementById('installBtn').style.display = 'inline-block';
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install outcome:', outcome);
            deferredPrompt = null;
          }
        });

        // Check PWA support on load
        checkPWASupport();
      </script>
    </body>
    </html>
  `);
});

// Test claim route
app.get('/claim/:id', (req, res) => {
  res.send(`
    <h1>Test Claim Page</h1>
    <p>ID: ${req.params.id}</p>
    <p>This would be your claim interface.</p>
    <a href="/">← Back to home</a>
  `);
});

const PORT = process.env.PORT || 8080;

// Try to start with HTTP first (easier for testing)
app.listen(PORT, () => {
  console.log(`🚀 PWA Test Server running on http://localhost:${PORT}`);
  console.log('📱 To test PWA features:');
  console.log('   1. Open in Chrome/Edge');
  console.log('   2. Check DevTools → Application → Manifest');
  console.log('   3. Look for install prompt in address bar');
  console.log('   4. For full PWA features, deploy to HTTPS domain');
});