// Simple icon creation script for PWA
const fs = require('fs');
const path = require('path');

// Create icons directory if doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Basic SVG music icon
const musicIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#60a5fa" width="512" height="512">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9.5V5l6 4.5-6 4.5v-3.5z"/>
</svg>`;

// Create a png-like file for each size
const sizes = [192, 512];

sizes.forEach(size => {
  const iconFilePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  // Write SVG content to PNG file (this is a hack, but will show something in the browser)
  fs.writeFileSync(iconFilePath, musicIconSvg);
  console.log(`Created ${iconFilePath}`);
});

// Create a basic favicon too
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), musicIconSvg);
console.log('Basic PWA icons created');
