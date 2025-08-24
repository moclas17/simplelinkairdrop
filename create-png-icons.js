// Create PNG icons for better Android PWA compatibility
import fs from 'fs';
import path from 'path';

// Base64 encoded PNG icons (simple diamond design for Android compatibility)
const createPNGIcon = (size) => {
  // Create a simple canvas-style PNG as base64
  // This creates a basic icon that Android will recognize properly
  const canvas = `data:image/svg+xml;base64,${Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#7dd3fc"/>
      <stop offset="100%" style="stop-color:#0369a1"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size/8}"/>
  <circle cx="${size/2}" cy="${size/3}" r="${size/6}" fill="white" opacity="0.9"/>
  <text x="${size/2}" y="${size/2 + size/16}" font-family="Arial" font-size="${size/8}" font-weight="bold" text-anchor="middle" fill="white">💎</text>
  <circle cx="${size*0.3}" cy="${size*0.75}" r="${size/15}" fill="none" stroke="white" stroke-width="2"/>
  <circle cx="${size*0.7}" cy="${size*0.75}" r="${size/15}" fill="none" stroke="white" stroke-width="2"/>
</svg>`).toString('base64')}`;
  
  return canvas;
};

// Generate PNG-compatible icons for Android
const sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const iconsDir = './public/icons';

console.log('🤖 Creating PNG-compatible icons for Android PWA...');

sizes.forEach(size => {
  // Create SVG that renders better as PNG
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #7dd3fc, #0369a1);">
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${Math.max(8, size/16)}"/>
  <defs>
    <radialGradient id="grad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#7dd3fc"/>
      <stop offset="100%" style="stop-color:#0369a1"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${Math.max(8, size/16)}"/>
  <circle cx="${size/2}" cy="${size/2.5}" r="${size/6}" fill="rgba(255,255,255,0.9)"/>
  <text x="${size/2}" y="${size/2 + size/12}" font-family="system-ui, Arial" font-size="${Math.max(16, size/10)}" font-weight="bold" text-anchor="middle" fill="white">💎</text>
  <ellipse cx="${size*0.35}" cy="${size*0.8}" rx="${size/20}" ry="${size/25}" fill="none" stroke="white" stroke-width="${Math.max(2, size/80)}"/>
  <ellipse cx="${size*0.65}" cy="${size*0.8}" rx="${size/20}" ry="${size/25}" fill="none" stroke="white" stroke-width="${Math.max(2, size/80)}"/>
</svg>`;
  
  const filename = `icon-${size}x${size}.png.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename} (Android-optimized SVG)`);
});

console.log('\n📱 Android-optimized icons created!');
console.log('🔧 These SVGs are optimized to render better when converted to PNG');
console.log('📂 Convert these to actual PNG files using: https://svg2png.com or similar tool');
console.log('📱 For immediate Android testing, the SVGs should work, but PNG is recommended for production');