// Debug PWA installability
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// Serve with proper PWA headers
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('manifest.json')) {
      res.set('Content-Type', 'application/manifest+json');
      res.set('Cache-Control', 'no-cache');
    }
    if (filePath.endsWith('sw.js')) {
      res.set('Content-Type', 'application/javascript');
      res.set('Service-Worker-Allowed', '/');
      res.set('Cache-Control', 'no-cache');
    }
  }
}));

// Debug home page with enhanced PWA detection
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chingadrop - PWA Debug</title>
  
  <!-- Essential PWA Meta -->
  <meta name="theme-color" content="#7dd3fc">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Chingadrop">
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg">
  
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0b1220, #1a2440);
      color: white;
      padding: 20px;
      margin: 0;
      min-height: 100vh;
    }
    .debug-section {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 12px;
      margin: 15px 0;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .status { 
      padding: 8px 12px; 
      border-radius: 6px; 
      margin: 5px 0; 
      font-weight: 600;
    }
    .pass { background: rgba(34,197,94,0.2); color: #22c55e; }
    .fail { background: rgba(239,68,68,0.2); color: #ef4444; }
    .warn { background: rgba(251,191,36,0.2); color: #fbbf24; }
    pre { 
      background: #0f1729; 
      padding: 12px; 
      border-radius: 8px; 
      overflow-x: auto;
      font-size: 12px;
    }
    .install-btn {
      background: #7dd3fc;
      color: #0b1220;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 16px;
      width: 100%;
      margin: 10px 0;
    }
    .install-btn:disabled {
      background: #666;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Chingadrop PWA Debug</h1>
    
    <div class="debug-section">
      <h3>📱 Información del Dispositivo</h3>
      <div id="device-info"></div>
    </div>

    <div class="debug-section">
      <h3>✅ Criterios PWA</h3>
      <div id="pwa-criteria"></div>
    </div>

    <div class="debug-section">
      <h3>📋 Manifest Status</h3>
      <div id="manifest-status"></div>
    </div>

    <div class="debug-section">
      <h3>⚙️ Service Worker</h3>
      <div id="sw-status"></div>
    </div>

    <div class="debug-section">
      <h3>🔧 Install Prompt</h3>
      <div id="install-status">Esperando prompt...</div>
      <button id="manual-install" class="install-btn" disabled>
        📱 Instalar PWA
      </button>
    </div>

    <div class="debug-section">
      <h3>📝 Console Logs</h3>
      <pre id="console-logs"></pre>
    </div>
  </div>

  <script>
    let deferredPrompt;
    let logs = [];

    // Enhanced logging
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      logs.push(args.join(' '));
      document.getElementById('console-logs').textContent = logs.slice(-10).join('\\n');
    };

    // Device info
    document.getElementById('device-info').innerHTML = \`
      <div><strong>User Agent:</strong> \${navigator.userAgent}</div>
      <div><strong>Is Android:</strong> \${/Android/i.test(navigator.userAgent)}</div>
      <div><strong>Is Chrome:</strong> \${/Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent)}</div>
      <div><strong>Is Mobile:</strong> \${/Mobi|Android/i.test(navigator.userAgent)}</div>
      <div><strong>Screen:</strong> \${screen.width}x\${screen.height}</div>
      <div><strong>Viewport:</strong> \${window.innerWidth}x\${window.innerHeight}</div>
      <div><strong>Protocol:</strong> \${location.protocol}</div>
      <div><strong>Host:</strong> \${location.host}</div>
    \`;

    // PWA Criteria Check
    function checkPWACriteria() {
      const criteria = {
        'HTTPS or localhost': location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname.includes('192.168'),
        'Service Worker support': 'serviceWorker' in navigator,
        'Manifest link': !!document.querySelector('link[rel="manifest"]'),
        'BeforeInstallPrompt support': 'BeforeInstallPromptEvent' in window,
        'Standalone display': window.matchMedia('(display-mode: standalone)').matches
      };

      let html = '';
      for (const [criterion, passed] of Object.entries(criteria)) {
        const className = passed ? 'pass' : 'fail';
        html += \`<div class="status \${className}">\${passed ? '✅' : '❌'} \${criterion}</div>\`;
      }
      document.getElementById('pwa-criteria').innerHTML = html;
      
      return criteria;
    }

    // Check manifest
    async function checkManifest() {
      try {
        const response = await fetch('/manifest.json');
        const manifest = await response.json();
        
        console.log('Manifest loaded:', manifest);
        
        const checks = {
          'Manifest accessible': response.ok,
          'Has name': !!manifest.name,
          'Has start_url': !!manifest.start_url,
          'Has display': manifest.display === 'standalone' || manifest.display === 'fullscreen',
          'Has icons': manifest.icons && manifest.icons.length > 0,
          'Has 192px icon': manifest.icons?.some(icon => icon.sizes.includes('192')),
          'Has 512px icon': manifest.icons?.some(icon => icon.sizes.includes('512'))
        };

        let html = '';
        for (const [check, passed] of Object.entries(checks)) {
          const className = passed ? 'pass' : 'fail';
          html += \`<div class="status \${className}">\${passed ? '✅' : '❌'} \${check}</div>\`;
        }
        
        html += \`<pre>\${JSON.stringify(manifest, null, 2)}</pre>\`;
        document.getElementById('manifest-status').innerHTML = html;
        
      } catch (error) {
        console.error('Manifest error:', error);
        document.getElementById('manifest-status').innerHTML = 
          \`<div class="status fail">❌ Error loading manifest: \${error.message}</div>\`;
      }
    }

    // Register Service Worker
    async function registerSW() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered:', registration);
          
          document.getElementById('sw-status').innerHTML = \`
            <div class="status pass">✅ Service Worker registered</div>
            <div><strong>Scope:</strong> \${registration.scope}</div>
            <div><strong>State:</strong> \${registration.active?.state || 'installing'}</div>
          \`;
          
        } catch (error) {
          console.error('SW registration failed:', error);
          document.getElementById('sw-status').innerHTML = 
            \`<div class="status fail">❌ SW registration failed: \${error.message}</div>\`;
        }
      } else {
        document.getElementById('sw-status').innerHTML = 
          '<div class="status fail">❌ Service Worker not supported</div>';
      }
    }

    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎉 beforeinstallprompt fired!');
      e.preventDefault();
      deferredPrompt = e;
      
      const btn = document.getElementById('manual-install');
      btn.disabled = false;
      btn.textContent = '🎉 Instalar PWA (Prompt disponible)';
      
      document.getElementById('install-status').innerHTML = 
        '<div class="status pass">✅ Install prompt available</div>';
    });

    document.getElementById('manual-install').addEventListener('click', async () => {
      if (deferredPrompt) {
        console.log('Showing install prompt...');
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        
        document.getElementById('install-status').innerHTML += 
          \`<div class="status \${outcome === 'accepted' ? 'pass' : 'warn'}">
            \${outcome === 'accepted' ? '✅' : '⚠️'} User choice: \${outcome}
          </div>\`;
        
        deferredPrompt = null;
      } else {
        alert('No hay prompt de instalación disponible. Usa el menú de Chrome: ⋮ → "Agregar a pantalla de inicio"');
      }
    });

    window.addEventListener('appinstalled', (evt) => {
      console.log('App installed successfully');
      document.getElementById('install-status').innerHTML += 
        '<div class="status pass">✅ App installed successfully!</div>';
    });

    // Run checks
    checkPWACriteria();
    checkManifest();
    registerSW();

    // Show network info
    console.log('Local IP:', '${localIP}');
    console.log('Access from Android:', 'http://${localIP}:3002');
  </script>
</body>
</html>`);
});

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🔧 PWA Debug Server running!');
  console.log('');
  console.log('📱 Para Android:');
  console.log('  URL: http://' + localIP + ':' + PORT);
  console.log('');
  console.log('🔍 Este servidor te mostrará:');
  console.log('  ✅ Si tu dispositivo cumple criterios PWA');
  console.log('  📋 Estado del manifest.json');
  console.log('  ⚙️ Registro de Service Worker');
  console.log('  🎯 Si el prompt de instalación está disponible');
  console.log('');
  console.log('💡 Abre en Chrome Android para debugging completo');
});