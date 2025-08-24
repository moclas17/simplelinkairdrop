// Android PWA Test Server
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// Serve PWA static files with proper headers for Android
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for PWA files
    if (path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
      res.set('Cache-Control', 'no-cache'); // Don't cache manifest for testing
    }
    if (path.endsWith('.js') && path.includes('sw.js')) {
      res.set('Content-Type', 'application/javascript');
      res.set('Service-Worker-Allowed', '/');
      res.set('Cache-Control', 'no-cache'); // Don't cache SW for testing
    }
    if (path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache for icons
    }
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache for images
    }
  }
}));

// Import API handlers
import generateHandler from './api/generate.js';
import claimHandler from './api/claim.js';
import claimViewHandler from './api/claim-view.js';

// Wrap Vercel handlers for Express
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Android PWA Test Home Page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Chingadrop PWA - Android Test</title>
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#7dd3fc">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Chingadrop">
  
  <!-- Android PWA Meta Tags -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="application-name" content="Chingadrop">
  <meta name="msapplication-TileColor" content="#0b1220">
  <meta name="msapplication-navbutton-color" content="#7dd3fc">
  <meta name="msapplication-starturl" content="/">
  <meta name="format-detection" content="telephone=no">
  <meta name="description" content="Test PWA functionality on Android">
  
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
      padding: 20px;
      margin: 0;
      min-height: 100vh;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 20px;
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
    h1 { margin: 0 0 10px; color: #7dd3fc; text-align: center; }
    .status {
      margin: 15px 0;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
      text-align: center;
    }
    .ready { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .install-btn {
      background: #7dd3fc;
      color: #0b1220;
      border: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-size: 16px;
      margin: 10px 0;
    }
    .install-btn:hover { background: #38bdf8; }
    .install-btn:disabled { background: #666; cursor: not-allowed; }
    .info { font-size: 14px; color: #a0a0a0; margin-top: 20px; }
    .ip-info {
      background: rgba(125,211,252,0.1);
      border: 1px solid rgba(125,211,252,0.3);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">💎</div>
      <h1>Chingadrop PWA</h1>
      <p style="text-align: center; color: #7dd3fc;">Prueba en Android</p>
      
      <div class="ip-info">
        <strong>🌐 Conexión:</strong><br>
        Local: http://localhost:${req.socket.localPort}<br>
        Red: http://${localIP}:${req.socket.localPort}
      </div>
      
      <div id="pwaStatus" class="status">
        🔄 Verificando compatibilidad PWA...
      </div>
      
      <button id="installBtn" class="install-btn" style="display: none;">
        📱 Instalar App en Android
      </button>
      
      <div class="info">
        <h3 style="color: #7dd3fc;">📋 Pasos para Android:</h3>
        <ol style="line-height: 1.6;">
          <li>Abre Chrome en tu dispositivo Android</li>
          <li>Navega a: <strong>http://${localIP}:${req.socket.localPort}</strong></li>
          <li>Busca "Agregar a pantalla de inicio" en el menú de Chrome</li>
          <li>O espera a que aparezca el banner de instalación</li>
          <li>Toca "Instalar" cuando aparezca la opción</li>
        </ol>
        
        <h3 style="color: #7dd3fc;">🔧 Características PWA:</h3>
        <ul style="line-height: 1.6;">
          <li>Instalación en pantalla de inicio</li>
          <li>Modo pantalla completa (standalone)</li>
          <li>Funcionamiento offline</li>
          <li>Iconos personalizados</li>
          <li>Carga rápida con caché</li>
        </ul>
      </div>
    </div>
  </div>

  <script>
    // PWA Status Check for Android
    function checkPWASupport() {
      const status = document.getElementById('pwaStatus');
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
      
      if ('serviceWorker' in navigator) {
        if (isAndroid && isChrome) {
          status.className = 'status ready';
          status.textContent = '✅ PWA compatible - Chrome Android detectado';
        } else if (isAndroid) {
          status.className = 'status ready';
          status.textContent = '✅ PWA compatible - Recomendamos usar Chrome';
        } else {
          status.className = 'status ready';
          status.textContent = '✅ PWA compatible - Prueba en Android Chrome';
        }
      } else {
        status.className = 'status error';
        status.textContent = '❌ Service Workers no disponibles';
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

    // Install Prompt Handler
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      deferredPrompt = e;
      const installBtn = document.getElementById('installBtn');
      installBtn.style.display = 'block';
      installBtn.disabled = false;
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
      const installBtn = document.getElementById('installBtn');
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        
        if (outcome === 'accepted') {
          installBtn.textContent = '✅ App instalada correctamente';
          installBtn.disabled = true;
        }
        deferredPrompt = null;
      }
    });

    // Handle app installation
    window.addEventListener('appinstalled', (evt) => {
      console.log('App installed successfully');
      const installBtn = document.getElementById('installBtn');
      installBtn.textContent = '✅ App instalada - Revisa tu pantalla de inicio';
      installBtn.disabled = true;
    });

    // Check PWA support on load
    checkPWASupport();
    
    // Display device info
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Android:', /Android/i.test(navigator.userAgent));
    console.log('Is Chrome:', /Chrome/i.test(navigator.userAgent));
  </script>
</body>
</html>`);
});

// API routes
app.use('/api/generate', wrapHandler(generateHandler));
app.use('/api/claim', wrapHandler(claimHandler));
app.use('/api/claim-view', wrapHandler(claimViewHandler));
app.get('/claim/:id', (req, res) => {
  const modifiedReq = {
    ...req,
    query: { id: req.params.id },
    method: 'GET'
  };
  wrapHandler(claimViewHandler)(modifiedReq, res);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Android PWA Test Server started!');
  console.log('');
  console.log('📱 Para probar en Android:');
  console.log('');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('  Red:     http://' + localIP + ':' + PORT);
  console.log('');
  console.log('📋 Instrucciones para Android:');
  console.log('  1. Conecta tu dispositivo Android a la misma red WiFi');
  console.log('  2. Abre Chrome en tu Android');
  console.log('  3. Navega a: http://' + localIP + ':' + PORT);
  console.log('  4. Busca el banner "Agregar a pantalla de inicio"');
  console.log('  5. O usa el menú de Chrome → "Agregar a pantalla de inicio"');
  console.log('');
  console.log('🔧 Para detener el servidor: Ctrl+C');
});