// Android HTTPS PWA Test Server
import 'dotenv/config';
import express from 'express';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

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

// Create self-signed certificate for testing
const createSelfSignedCert = () => {
  const cert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQC5Q8Q5Q8Q5QTANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdU
ZXN0aW5nMB4XDTI0MDEwMTAwMDAwMFoXDTI1MDEwMTAwMDAwMFowEjEQMA4GA1UE
AwwHVGVzdGluZzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAM5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
wIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCkQ8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q8Q5Q
-----END CERTIFICATE-----`;

  const key = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDOUPEOUPEOUPEO
UPEOUPE OPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOP
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
wIDAQABAoIBAQDOUPEOUPEOUPEOUPEOUPEOUPEOUPEOUPEOUPEOUPEOUPEOUPEO
UPEOUPE EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU EOPEOPU
-----END PRIVATE KEY-----`;

  return { cert, key };
};

// Serve PWA static files with proper headers for Android
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
    if (path.endsWith('.js') && path.includes('sw.js')) {
      res.set('Content-Type', 'application/javascript');
      res.set('Service-Worker-Allowed', '/');
    }
    if (path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

// Import API handlers
import generateHandler from './api/generate.js';
import claimHandler from './api/claim.js';
import claimViewHandler from './api/claim-view.js';

const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Android PWA Instructions Page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Chingadrop - Instalar PWA en Android</title>
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#7dd3fc">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="application-name" content="Chingadrop">
  <meta name="description" content="Instalar Chingadrop como PWA en Android">
  
  <!-- PWA Icons -->
  <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg">
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
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }
    h1 { color: #7dd3fc; text-align: center; margin-bottom: 20px; }
    .step {
      background: rgba(125,211,252,0.05);
      border: 1px solid rgba(125,211,252,0.2);
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
    }
    .step h3 { color: #7dd3fc; margin: 0 0 10px; }
    .highlight { background: rgba(125,211,252,0.2); padding: 2px 6px; border-radius: 4px; }
    .test-link {
      display: block;
      background: #7dd3fc;
      color: #0b1220;
      text-decoration: none;
      padding: 15px;
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>📱 Instalar Chingadrop PWA en Android</h1>
      
      <div class="step">
        <h3>📍 Paso 1: Acceso desde Android</h3>
        <p>Desde tu dispositivo Android, abre <strong>Chrome</strong> y navega a:</p>
        <div style="background: #0f1729; padding: 12px; border-radius: 8px; font-family: monospace;">
          http://${localIP}:${req.socket.localPort}
        </div>
      </div>
      
      <div class="step">
        <h3>📱 Paso 2: Buscar opción de instalación</h3>
        <p>En Chrome Android, busca una de estas opciones:</p>
        <ul>
          <li><strong>Banner automático:</strong> "Agregar [nombre] a la pantalla de inicio"</li>
          <li><strong>Menú de Chrome:</strong> Toca <span class="highlight">⋮</span> → "Agregar a pantalla de inicio"</li>
          <li><strong>Icono en barra:</strong> Busca el ícono de instalación en la barra de direcciones</li>
        </ul>
      </div>
      
      <div class="step">
        <h3>🔧 Paso 3: Si no aparece la opción</h3>
        <p>Algunos factores pueden prevenir la instalación:</p>
        <ul>
          <li><strong>Chrome actualizado:</strong> Asegúrate de tener Chrome 76+ en Android</li>
          <li><strong>HTTPS requerido:</strong> Algunos Androids requieren HTTPS para PWA</li>
          <li><strong>Uso previo:</strong> Visita la página varias veces para que Chrome detecte engagement</li>
          <li><strong>Esperar:</strong> A veces toma unos minutos para que aparezca el prompt</li>
        </ul>
      </div>
      
      <a href="/claim/test" class="test-link">
        🧪 Probar página de claim
      </a>
      
      <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #7e8aa0;">
        <p>🔍 <strong>Debugging:</strong> Abre DevTools en Chrome Android y revisa la consola para logs de PWA</p>
        <p>📋 <strong>Manifest:</strong> <a href="/manifest.json" style="color: #7dd3fc;">Ver manifest.json</a></p>
        <p>⚙️ <strong>Service Worker:</strong> <a href="/sw.js" style="color: #7dd3fc;">Ver sw.js</a></p>
      </div>
    </div>
  </div>

  <script>
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.error('SW failed:', err));
    }

    // Debug info
    console.log('=== PWA Debug Info ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Android:', /Android/i.test(navigator.userAgent));
    console.log('Is Chrome:', /Chrome/i.test(navigator.userAgent));
    console.log('Protocol:', location.protocol);
    console.log('Has SW:', 'serviceWorker' in navigator);
    console.log('Has install prompt:', 'BeforeInstallPromptEvent' in window);
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎉 Install prompt triggered!');
      e.preventDefault();
      
      // Show custom install UI
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#7dd3fc;color:#0b1220;padding:15px 20px;border-radius:12px;z-index:9999;font-weight:600;';
      banner.innerHTML = '📱 ¡Instalar Chingadrop! <button onclick="installApp()" style="margin-left:10px;background:#0b1220;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Instalar</button>';
      document.body.appendChild(banner);
      
      window.installApp = async () => {
        e.prompt();
        const { outcome } = await e.userChoice;
        console.log('Install result:', outcome);
        banner.remove();
      };
    });
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

const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

// Start HTTP server
http.createServer(app).listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('🚀 Chingadrop PWA Server for Android');
  console.log('');
  console.log('📡 Servidores activos:');
  console.log('  HTTP:  http://localhost:' + HTTP_PORT);
  console.log('  HTTP:  http://' + localIP + ':' + HTTP_PORT);
  console.log('');
  console.log('📱 INSTRUCCIONES PARA ANDROID:');
  console.log('');
  console.log('  1. 📶 Conecta tu Android a la misma red WiFi');
  console.log('  2. 🌐 Abre Chrome en tu dispositivo Android');  
  console.log('  3. 🔗 Navega a: http://' + localIP + ':' + HTTP_PORT);
  console.log('  4. 📱 Busca "Agregar a pantalla de inicio" en el menú de Chrome');
  console.log('  5. ⏳ Si no aparece inmediatamente, espera unos minutos y recarga');
  console.log('  6. 🔄 También puedes intentar navegar por la app varias veces');
  console.log('');
  console.log('🔍 DEBUGGING:');
  console.log('  • Abre DevTools en Chrome (chrome://inspect en desktop)');
  console.log('  • Conecta tu Android via USB y habilita USB debugging');
  console.log('  • Ve a Application tab → Manifest para verificar PWA');
  console.log('');
  console.log('❗ NOTA: Si sigues sin ver la opción de instalación:');
  console.log('  - Algunos dispositivos Android requieren HTTPS');
  console.log('  - Chrome necesita detectar "engagement" (uso repetido)');
  console.log('  - Prueba usar el menú manual: Chrome → ⋮ → "Agregar a pantalla de inicio"');
  console.log('');
  console.log('🔧 Para detener: Ctrl+C');
});