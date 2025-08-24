#!/usr/bin/env python3
# Create simple PNG icons for PWA

from PIL import Image, ImageDraw
import os

def create_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw background gradient (approximated with solid colors)
    # Background dark blue
    draw.rectangle([0, 0, size, size], fill=(11, 18, 32, 255))
    
    # Main shape (rounded rectangle)
    margin = size // 10
    draw.rounded_rectangle([margin, margin, size-margin, size-margin], 
                          radius=size//8, fill=(125, 211, 252, 255))
    
    # Highlight circle
    center = size // 2
    highlight_radius = size // 6
    draw.ellipse([center-highlight_radius, center-highlight_radius//2, 
                  center+highlight_radius, center+highlight_radius//2], 
                 fill=(255, 255, 255, 230))
    
    # Save icon
    img.save(filename, 'PNG')
    print(f"✓ Created {filename} ({size}x{size})")

# Create icons directory
os.makedirs('public/icons', exist_ok=True)

# Create required icons
sizes = [192, 512]
for size in sizes:
    filename = f'public/icons/icon-{size}x{size}.png'
    create_icon(size, filename)

print("\n📱 Real PNG icons created for Android PWA!")
print("🔧 These are genuine PNG files that Android will recognize")