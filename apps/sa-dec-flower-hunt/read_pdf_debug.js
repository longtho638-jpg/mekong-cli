const fs = require('fs');
const pdfLib = require('pdf-parse');

console.log('Type of pdfLib:', typeof pdfLib);
console.log('Exports:', Object.keys(pdfLib));

const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');

try {
    // Try calling it if it's a function, otherwise look for default
    const parse = typeof pdfLib === 'function' ? pdfLib : pdfLib.default || pdfLib;

    if (typeof parse === 'function') {
        parse(dataBuffer).then(function (data) {
            console.log('\n--- START OF TEXT ---\n');
            console.log(data.text.slice(0, 1000)); // Print first 1000 chars
            console.log('\n--- END OF TEXT ---\n');
        }).catch(err => console.error('Parse error:', err));
    } else {
        console.error('Could not find parse function');
    }
} catch (e) {
    console.error(e);
}
