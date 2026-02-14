const fs = require('fs');

async function read() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');
    const lib = require('pdf-parse');
    const PDFParse = lib.PDFParse || lib;

    try {
        const uint8 = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8);
        console.log('Calling getText()...');
        const result = await parser.getText();

        console.log('Type of result:', typeof result);
        console.log('Is Array?', Array.isArray(result));

        if (typeof result === 'string') {
            console.log(result.slice(0, 1000));
        } else {
            console.log('Result structure:', result);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

read();
