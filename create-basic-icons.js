// Simple icon generator using Node.js
import fs from 'fs';
import path from 'path';

// Create basic placeholder icons for PWA
function createBasicIcon(size) {
  // Simple SVG that will work as PNG
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" style="stop-color:#7dd3fc"/>
        <stop offset="100%" style="stop-color:#0369a1"/>
      </radialGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="url(#grad)"/>
    <circle cx="${size/2}" cy="${size/3}" r="${size/6}" fill="white" opacity="0.9"/>
    <text x="${size/2}" y="${size/2 + 10}" font-family="Arial" font-size="${size/8}" font-weight="bold" text-anchor="middle" fill="white">💎</text>
    <circle cx="${size*0.3}" cy="${size*0.7}" rx="${size/20}" ry="${size/30}" fill="none" stroke="white" stroke-width="3"/>
    <circle cx="${size*0.7}" cy="${size*0.7}" rx="${size/20}" ry="${size/30}" fill="none" stroke="white" stroke-width="3"/>
  </svg>`;
  
  return svg;
}

// Generate icons for required sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = './public/icons';

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createBasicIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename}`);
});

console.log('\n📱 Basic PWA icons created successfully!');
console.log('🔧 For production, convert these SVGs to PNG using an online converter or image editor.');
console.log('📂 Files created in: ./public/icons/');