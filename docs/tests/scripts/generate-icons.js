/**
 * PataBima Icon Generator
 * Fixes adaptive icon sizing issues
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = './assets/';
const SOURCE_LOGO = path.join(ASSETS_DIR, 'PataLogo.png');

async function generateAdaptiveIcon() {
  try {
    console.log('🎨 Generating PataBima adaptive icon...');
    
    // Create adaptive icon with proper safe zone
    await sharp(SOURCE_LOGO)
      .resize(682, 682, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .extend({
        top: 171,    // (1024 - 682) / 2 = 171px padding
        bottom: 171,
        left: 171,
        right: 171,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    
    console.log('✅ Adaptive icon generated successfully!');
    
    // Also generate standard icon
    await sharp(SOURCE_LOGO)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 213, g: 34, b: 43, alpha: 1 } // PataBima red background
      })
      .png({ quality: 100 })
      .toFile(path.join(ASSETS_DIR, 'icon.png'));
    
    console.log('✅ Standard icon generated successfully!');
    
    // Generate splash icon with proper padding
    await sharp(SOURCE_LOGO)
      .resize(300, 300, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent for white background
      })
      .extend({
        top: 106,    // (512 - 300) / 2 = 106px padding
        bottom: 106,
        left: 106,
        right: 106,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
    
    console.log('✅ Splash icon generated successfully!');
    
    console.log('\n🎉 All PataBima icons generated with proper sizing!');
    console.log('\n📋 Next steps:');
    console.log('1. Build new APK: npm run build:android');
    console.log('2. Test icon appearance on device');
    console.log('3. Verify icon fits properly in different launcher shapes');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

// Icon sizing guide
console.log(`
📐 PataBima Icon Sizing Guide:

For Adaptive Icons:
- Canvas: 1024x1024px
- Safe Zone: 682x682px (center area that's always visible)
- Logo should fit within safe zone
- Background: Transparent (filled by backgroundColor in app.json)

Current Configuration:
- Foreground: ./assets/adaptive-icon.png
- Background: #D5222B (PataBima Red)

The script will:
1. Resize your logo to fit the 682x682 safe zone
2. Center it in a 1024x1024 transparent canvas
3. Generate all required icon formats
`);

if (require.main === module) {
  generateAdaptiveIcon();
}

module.exports = { generateAdaptiveIcon };
