const sharp = require('sharp');
const fs = require('fs');

const inputPath = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\99ce9565-e4b5-4933-9c34-792601087331\\chadra_icon_1781871513290.png';
const out192 = 'C:\\Users\\Asus\\Documents\\chadra-facture\\public\\icons\\icon-192x192.png';
const out512 = 'C:\\Users\\Asus\\Documents\\chadra-facture\\public\\icons\\icon-512x512.png';

async function resize() {
  try {
    await sharp(inputPath)
      .resize(192, 192)
      .toFile(out192);
    console.log('Created 192x192 icon');

    await sharp(inputPath)
      .resize(512, 512)
      .toFile(out512);
    console.log('Created 512x512 icon');
  } catch (err) {
    console.error('Error resizing:', err);
  }
}

resize();
