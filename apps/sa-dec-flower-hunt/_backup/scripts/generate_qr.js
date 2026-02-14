const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const flowers = require('../src/lib/flowers_data.json');

const baseUrl = process.argv[2] || 'https://sadec-hunt.vercel.app';
const outputDir = path.join(__dirname, '../public/qr-codes');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Generating QR codes for ${flowers.length} flowers...`);
console.log(`Base URL: ${baseUrl}`);

flowers.forEach(async (flower) => {
    const url = `${baseUrl}/flower/${flower.id}`;
    const filePath = path.join(outputDir, `flower-${flower.id}.png`);

    try {
        await QRCode.toFile(filePath, url, {
            color: {
                dark: '#D72638',  // Tet Red
                light: '#FFFFFF'
            },
            width: 300
        });
        console.log(`✅ Generated: ${filePath}`);
    } catch (err) {
        console.error(`❌ Error generating ${flower.name}:`, err);
    }
});
